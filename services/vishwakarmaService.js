const axios = require('axios');
const pool = require('../db_config');
require('dotenv').config();

const BASE_URL = process.env.VISHWAKARMA_BASE_URL || 'https://devupsicapi.psweb.in';
const USER_ID = process.env.VISHWAKARMA_USER_ID || 'IntegrationIITKnp';
const PASSWORD = process.env.VISHWAKARMA_PASSWORD || 'IntIitKnp@321#4';

async function authenticate() {
    try {
        const encodedPassword = encodeURIComponent(PASSWORD);
        const authUrl = `${BASE_URL}/api/IITKnpArtisanData/AuthenticateUser?UserId=${USER_ID}&Password=${encodedPassword}`;

        const response = await axios.post(authUrl);

        const token = response.data.Token || response.data.token;
        const success = response.data.Success || response.data.success;

        if (success && token) {
            return token;
        } else {
            throw new Error('Authentication failed: ' + (response.data.Message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error authenticating:', error.message);
        throw error;
    }
}

async function fetchArtisans(token, date, page) {
    try {
        // Assuming the API endpoint supports Date and PageNo query parameters
        // If the API uses different parameter names, these need to be adjusted.
        // Based on typical patterns: ?Date=YYYY-MM-DD&PageNo=1
        let url = `${BASE_URL}/api/IITKnpArtisanData/GetArtisansIITKanpur`;

        const params = {};
        if (date) params.Date = date;
        if (page) params.PageNo = page;


        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: params
        });

        return response.data.data || [];
    } catch (error) {
        console.error(`Error fetching artisans for date ${date} page ${page}:`, error.message);
        throw error;
    }
}

const UserAccount = require('../models/UserAccount');
const Seller = require('../models/Seller');
const Category = require('../models/Category');
const SellerService = require('../models/SellerService');
const SellerServiceLocation = require('../models/SellerServiceLocation');

async function saveArtisansToDB(artisans) {
    if (!artisans || artisans.length === 0) return { inserted: 0, updated: 0 };

    let insertedCount = 0;
    let updatedCount = 0;

    for (const artisan of artisans) {
        try {
            // 1. UserAccount
            const [userAccount, createdUser] = await UserAccount.findOrCreate({
                where: { source: 'VISHWAKARMA', source_id: String(artisan.artisanId) },
                defaults: {
                    fullname: artisan.artisanName,
                    mobile: artisan.contactNo,
                    last_location: `${artisan.lattitude},${artisan.longitude}`,
                    roles: { seller: ['ARTISAN'], buyer: [] },
                    source: 'VISHWAKARMA',
                    source_id: String(artisan.artisanId)
                }
            });

            if (!createdUser) {
                await userAccount.update({
                    fullname: artisan.artisanName,
                    mobile: artisan.contactNo,
                    last_location: `${artisan.lattitude},${artisan.longitude}`
                });
                updatedCount++;
            } else {
                insertedCount++;
            }

            // 2. Seller
            const [seller] = await Seller.findOrCreate({
                where: { user_account_id: userAccount.id },
                defaults: {
                    fullname: artisan.artisanName
                }
            });

            let categoryData = artisan.serviceCategory;
            if (!Array.isArray(categoryData)) {
                categoryData = [categoryData];
            }

            for (const catData of categoryData) {
                if (!catData || !catData.serviceCategoryId) continue;

                // 3a. Root Category (L1)
                const rootHcode = String(catData.serviceCategoryId);
                const [rootCategory] = await Category.findOrCreate({
                    where: { hcode: rootHcode },
                    defaults: {
                        name: catData.serviceCategoryName,
                        parent_id: null
                    }
                });

                if (catData.serviceSubCategory && Array.isArray(catData.serviceSubCategory)) {
                    for (const subCatData of catData.serviceSubCategory) {
                        if (!subCatData.serviceSubCategoryId) continue;

                        // 3b. Sub Category (L2)
                        const subHcode = `${rootHcode}.${subCatData.serviceSubCategoryId}`;
                        const [subCategory] = await Category.findOrCreate({
                            where: { hcode: subHcode },
                            defaults: {
                                name: subCatData.subCategoryName,
                                parent_id: rootCategory.id
                            }
                        });

                        // 3c. Service as Category (L3) & Seller Services
                        if (subCatData.service && Array.isArray(subCatData.service)) {
                            for (const srv of subCatData.service) {
                                if (!srv.serviceId) continue;

                                // Create L3 Category for the Service Type
                                const serviceHcode = `${subHcode}.${srv.serviceId}`;
                                const [serviceCategory] = await Category.findOrCreate({
                                    where: { hcode: serviceHcode },
                                    defaults: {
                                        name: srv.serviceName,
                                        parent_id: subCategory.id
                                    }
                                });

                                // 4. Seller Service (Linked to L3 Category)
                                const [sellerService] = await SellerService.findOrCreate({
                                    where: {
                                        seller_id: seller.id,
                                        category_id: serviceCategory.id,
                                        name: srv.serviceName
                                    },
                                    defaults: {
                                        description: null,
                                        co_ordinates: `${artisan.lattitude},${artisan.longitude}`
                                    }
                                });

                                // 5. Seller Service Location
                                await SellerServiceLocation.findOrCreate({
                                    where: { seller_service_id: sellerService.id },
                                    defaults: {
                                        latitude: artisan.lattitude,
                                        longitude: artisan.longitude
                                    }
                                });
                            }
                        }
                    }
                }
            }

        } catch (err) {
            console.error(`   Failed to process artisan ${artisan.artisanId}:`, err.message);
        }
    }
    return { inserted: insertedCount, updated: updatedCount };
}

async function syncArtisansByDate(date) {
    console.log(`Starting Artisan Sync for Date: ${date}`);
    try {
        const token = await authenticate();
        let page = 1;
        let totalInserted = 0;
        let totalUpdated = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            console.log(` Fetching page ${page} for date ${date}...`);
            const artisans = await fetchArtisans(token, date, page);

            if (artisans.length === 0) {
                console.log(` No more data for date ${date} at page ${page}. Stopping.`);
                hasMoreData = false;
                break;
            }

            console.log(`   Fetched ${artisans.length} artisans. Saving to DB...`);
            const { inserted, updated } = await saveArtisansToDB(artisans);

            totalInserted += inserted;
            totalUpdated += updated;
            console.log(`   Page ${page} done. New: ${inserted}, Updated: ${updated}`);

            page++;
        }

        console.log(`Sync completed for ${date}. Total New: ${totalInserted}, Total Updated: ${totalUpdated}`);
        return { success: true, date, inserted: totalInserted, updated: totalUpdated };

    } catch (error) {
        console.error(`Sync failed for date ${date}:`, error.message);
        return { success: false, date, error: error.message };
    }
}

async function syncArtisans() {
    // Default cron job behavior: Sync for "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Running Daily Sync for Yesterday: ${dateStr}`);
    return await syncArtisansByDate(dateStr);
}

module.exports = {
    syncArtisans,
    syncArtisansByDate,
    saveArtisansToDB // Exported for testing
};
