const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const UserAccount = require('../models/UserAccount');
const Seller = require('../models/Seller');
const SellerService = require('../models/SellerService');
const SellerServiceLocation = require('../models/SellerServiceLocation');
const UserAccountPin = require('../models/UserAccountPin');
const Category = require('../models/Category');
const SellerPost = require('../models/SellerPost');

// Helper to calculate distance using Haversine formula in SQL
const haversineDistance = (lat, long, tableAlias = 'SellerServiceLocation') => {
    return Sequelize.literal(`
        6371 * acos(
            cos(radians(${lat})) * cos(radians(CAST("${tableAlias}"."latitude" AS DOUBLE PRECISION))) *
            cos(radians(CAST("${tableAlias}"."longitude" AS DOUBLE PRECISION)) - radians(${long})) +
            sin(radians(${lat})) * sin(radians(CAST("${tableAlias}"."latitude" AS DOUBLE PRECISION)))
        )
    `);
};

// POST /api/user/location
exports.updateUserLocation = async (req, res) => {
    try {
        const { location } = req.body; // Expecting "lat,long" string
        const userId = req.user.id; // From auth middleware

        if (!location) {
            return res.status(400).json({ error: 'Location is required (lat,long)' });
        }

        await UserAccount.update({ last_location: location }, { where: { id: userId } });

        return res.status(200).json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error('Error updating location:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/sellers/nearby
exports.getNearbySellers = async (req, res) => {
    try {
        const { max_distance, category_id } = req.query;
        const userId = req.user.id;

        // Get user's last location if not provided in query (though requirement implies using user's current location passed or stored)
        // Requirement says: mobile apk send api call to sellers/nearby-sellers (authToken, max_distance + category)
        // It doesn't explicitly say it sends lat/long, so we might use stored location or expect it in body/query.
        // Let's assume we use the stored location if not provided, or better, fetch the user's stored location.

        const user = await UserAccount.findByPk(userId);
        if (!user || !user.last_location) {
            return res.status(400).json({ error: 'User location not found. Please update location first.' });
        }

        const [lat, long] = user.last_location.split(',').map(Number);
        const distanceLimit = max_distance ? parseFloat(max_distance) : 10; // Default 10km

        const whereClause = {};
        if (category_id) {
            whereClause['$SellerService.category_id$'] = category_id;
        }

        // Find SellerServiceLocations within distance
        // We need to join SellerServiceLocation -> SellerService -> Seller
        // And also check if pinned by user: Seller -> UserAccountPin

        const nearbyServices = await SellerServiceLocation.findAll({
            attributes: {
                include: [
                    [haversineDistance(lat, long, 'SellerServiceLocation'), 'distance']
                ]
            },
            include: [
                {
                    model: SellerService,
                    required: true,
                    where: category_id ? { category_id } : {},
                    include: [
                        {
                            model: Seller,
                            required: true,
                            include: [
                                {
                                    model: UserAccount, // To get seller's name if needed, though Seller has fullname
                                    attributes: ['fullname', 'mobile', 'id']
                                }
                            ]
                        }
                    ]
                }
            ],
            where: Sequelize.where(haversineDistance(lat, long, 'SellerServiceLocation'), {
                [Op.lte]: distanceLimit
            }),
            order: Sequelize.col('distance')
        });

        // Process results to format response and check pinned status
        // Fetch all pins for this user to check efficiently
        const userPins = await UserAccountPin.findAll({
            where: { user_account_id: userId },
            attributes: ['seller_id']
        });
        const pinnedSellerIds = new Set(userPins.map(pin => pin.seller_id));

        const results = nearbyServices.map(loc => {
            const service = loc.SellerService;
            const seller = service.Seller;
            const sellerUser = seller.UserAccount;

            return {
                seller_id: seller.id,
                fullname: seller.fullname || sellerUser.fullname,
                mobile: sellerUser.mobile,
                service_name: service.name,
                category_id: service.category_id,
                distance: parseFloat(loc.getDataValue('distance')).toFixed(2),
                is_pinned: pinnedSellerIds.has(seller.id),
                location: {
                    lat: loc.latitude,
                    long: loc.longitude
                }
            };
        });

        return res.status(200).json({ data: results });

    } catch (error) {
        console.error('Error fetching nearby sellers:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/categories/stats
exports.getCategories = async (req, res) => {
    try {
        const userId = req.user.id;
        // Use user's location to filter sellers in the region (optional requirement interpretation: "for that region")
        // If "region" means within max_distance, we need that. If it means generally, maybe we just count all.
        // The requirement says: "# of sellers in that category for that region - used to remove categories with 0 sellers."
        // Let's assume "region" implies a default distance or the same max_distance logic.
        // For simplicity and performance, let's start with a generous radius or just check existence if region isn't strictly defined.
        // However, to be useful, it should probably be somewhat local. Let's use a default 50km radius for "region".

        const user = await UserAccount.findByPk(userId);
        if (!user || !user.last_location) {
            // If no location, maybe return all categories with global counts or error?
            // Let's return error to enforce location update
            return res.status(400).json({ error: 'User location not found.' });
        }

        const [lat, long] = user.last_location.split(',').map(Number);
        const regionRadius = 50; // 50km

        // We need to count unique sellers per category within radius.
        // Query: Select Category.*, Count(Distinct SellerService.seller_id) 
        // Join Category -> SellerService -> SellerServiceLocation (filter by distance)

        const categories = await Category.findAll({
            attributes: {
                include: [
                    [Sequelize.fn('COUNT', Sequelize.col('SellerServices.id')), 'seller_count']
                ]
            },
            include: [
                {
                    model: SellerService,
                    attributes: [],
                    required: false, // Left join to get 0 counts initially
                    include: [
                        {
                            model: SellerServiceLocation,
                            attributes: [],
                            required: true, // Inner join here because we only care about services with locations in range
                            where: Sequelize.where(haversineDistance(lat, long, 'SellerServices->SellerServiceLocations'), {
                                [Op.lte]: regionRadius
                            })
                        }
                    ]
                }
            ],
            group: ['Category.id'],
            having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col('SellerServices.id')), '>', 0)
        });

        return res.status(200).json({ data: categories });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/search
exports.search = async (req, res) => {
    try {
        const { query, max_distance } = req.query;
        const userId = req.user.id;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const user = await UserAccount.findByPk(userId);
        if (!user || !user.last_location) {
            return res.status(400).json({ error: 'User location not found.' });
        }

        const [lat, long] = user.last_location.split(',').map(Number);
        const distanceLimit = max_distance ? parseFloat(max_distance) : 50; // Default 50km

        // Search Sellers (by name)
        // We need to join Seller -> SellerService -> SellerServiceLocation to filter by distance
        // Note: A seller might have multiple services/locations. We just need to know if ANY location is within range.

        const sellers = await Seller.findAll({
            where: {
                fullname: { [Op.iLike]: `%${query}%` }
            },
            include: [
                {
                    model: SellerService,
                    required: true,
                    include: [
                        {
                            model: SellerServiceLocation,
                            required: true,
                            where: Sequelize.where(haversineDistance(lat, long, 'SellerServices->SellerServiceLocations'), {
                                [Op.lte]: distanceLimit
                            })
                        }
                    ]
                },
                {
                    model: UserAccount,
                    attributes: ['mobile']
                }
            ]
        });

        // Search Categories (by name)
        // We also want to filter categories that have sellers nearby? 
        // Requirement says: "Search Results: Sellers, Categories"
        // Let's return categories matching the name, and maybe we can assume if they exist they are relevant.
        // Or better, use the same logic as getCategories but filter by name.

        const categories = await Category.findAll({
            where: {
                name: { [Op.iLike]: `%${query}%` }
            }
        });

        return res.status(200).json({
            data: {
                sellers: sellers.map(s => ({
                    id: s.id,
                    fullname: s.fullname,
                    mobile: s.UserAccount.mobile
                })),
                categories: categories
            }
        });

    } catch (error) {
        console.error('Error searching:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/feeds
exports.getFeeds = async (req, res) => {
    try {
        const userId = req.user.id;

        // Pinned Users (Sellers)
        const pinned = await UserAccountPin.findAll({
            where: { user_account_id: userId },
            include: [
                {
                    model: Seller,
                    include: [UserAccount]
                }
            ]
        });

        // Recent Users (Sellers or just UserAccounts? Requirement says "Recent Users")
        // Assuming recently created UserAccounts who are Sellers? Or just any user?
        // "Pinned Users, Recent Users" implies a mix. Let's fetch recent Sellers for relevance.

        const recentSellers = await Seller.findAll({
            limit: 10,
            order: [['created_at', 'DESC']],
            include: [UserAccount]
        });

        return res.status(200).json({
            data: {
                pinned_users: pinned.map(p => ({
                    seller_id: p.Seller.id,
                    fullname: p.Seller.fullname || p.Seller.UserAccount.fullname,
                    mobile: p.Seller.UserAccount.mobile
                })),
                recent_users: recentSellers.map(s => ({
                    seller_id: s.id,
                    fullname: s.fullname || s.UserAccount.fullname,
                    mobile: s.UserAccount.mobile
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching feeds:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/sellers/posts
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { caption, media_type, filepath } = req.body; // Assuming filepath is sent for now (mocking file upload)

        // Find Seller ID for this user
        const seller = await Seller.findOne({ where: { user_account_id: userId } });
        if (!seller) {
            return res.status(403).json({ error: 'User is not a seller' });
        }

        const post = await SellerPost.create({
            seller_id: seller.id,
            filepath: filepath || 'placeholder.jpg', // Mocking
            caption,
            media_type: media_type || 'IMAGE',
            status: 'UPLOADED'
        });

        return res.status(200).json({
            message: 'Post created successfully',
            post_id: post.id
        });

    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
