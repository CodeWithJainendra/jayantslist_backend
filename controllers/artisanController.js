const pool = require('../db_config');
const { syncArtisans, syncArtisansByDate } = require('../services/vishwakarmaService');

async function getAllArtisans(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9999;
        const offset = (page - 1) * limit;
        const district = req.query.district;

        // Build query with optional district filter
        let countQuery = 'SELECT COUNT(*) FROM artisans';
        let dataQuery = 'SELECT * FROM artisans';
        const params = [];

        if (district) {
            countQuery += ' WHERE district = $1';
            dataQuery += ' WHERE district = $1';
            params.push(district);
        }

        dataQuery += ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

        // Get total count
        const countResult = await pool.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Get paginated data
        const result = await pool.query(dataQuery, [...params, limit, offset]);

        res.json({
            success: true,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching artisans:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function triggerSync(req, res) {
    try {
        // Run sync in background, don't wait for it
        syncArtisans()
            .then((result) => console.log('Manual sync finished:', result))
            .catch(err => console.error('Manual sync failed', err));

        res.json({ success: true, message: 'Sync started in background' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to start sync' });
    }
}

async function triggerSyncForDates(req, res) {
    try {
        // Calculate dates
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        console.log(`Triggering sync for dates: ${yesterdayStr} and ${todayStr}`);

        // Run sequentially in background
        (async () => {
            try {
                console.log(`Starting background sync for ${yesterdayStr}...`);
                await syncArtisansByDate(yesterdayStr);

                console.log(`Starting background sync for ${todayStr}...`);
                await syncArtisansByDate(todayStr);

                console.log('Background sync for dates completed.');
            } catch (err) {
                console.error('Background sync for dates failed:', err);
            }
        })();

        res.json({
            success: true,
            message: `Sync started in background for ${yesterdayStr} and ${todayStr}`
        });
    } catch (error) {
        console.error('Error triggering sync for dates:', error);
        res.status(500).json({ success: false, message: 'Failed to start sync' });
    }
}


async function getServiceCategories(req, res) {
    try {
        // Fetch all service categories from the database
        // We fetch only the service_category column to minimize data transfer
        const result = await pool.query('SELECT service_category FROM artisans WHERE service_category IS NOT NULL');

        const categoryMap = new Map();

        result.rows.forEach(row => {
            const categoryData = row.service_category;

            let categoriesToProcess = [];
            if (Array.isArray(categoryData)) {
                categoriesToProcess = categoryData;
            } else if (categoryData) {
                categoriesToProcess = [categoryData];
            }

            categoriesToProcess.forEach(cat => {
                if (!cat || !cat.serviceCategoryId) return;

                const catId = cat.serviceCategoryId;

                if (!categoryMap.has(catId)) {
                    categoryMap.set(catId, {
                        serviceCategoryId: cat.serviceCategoryId,
                        serviceCategoryName: cat.serviceCategoryName,
                        subCategories: new Map()
                    });
                }

                const existingCat = categoryMap.get(catId);

                if (cat.serviceSubCategory && Array.isArray(cat.serviceSubCategory)) {
                    cat.serviceSubCategory.forEach(sub => {
                        if (!sub || !sub.serviceSubCategoryId) return;

                        const subId = sub.serviceSubCategoryId;

                        if (!existingCat.subCategories.has(subId)) {
                            existingCat.subCategories.set(subId, {
                                serviceSubCategoryId: sub.serviceSubCategoryId,
                                subCategoryName: sub.subCategoryName,
                                services: new Map()
                            });
                        }

                        const existingSub = existingCat.subCategories.get(subId);

                        if (sub.service && Array.isArray(sub.service)) {
                            sub.service.forEach(srv => {
                                if (!srv || !srv.serviceId) return;

                                if (!existingSub.services.has(srv.serviceId)) {
                                    existingSub.services.set(srv.serviceId, {
                                        serviceId: srv.serviceId,
                                        serviceName: srv.serviceName
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });

        // Convert Maps to Arrays for the final response
        const categories = Array.from(categoryMap.values()).map(cat => ({
            serviceCategoryId: cat.serviceCategoryId,
            serviceCategoryName: cat.serviceCategoryName,
            serviceSubCategory: Array.from(cat.subCategories.values()).map(sub => ({
                serviceSubCategoryId: sub.serviceSubCategoryId,
                subCategoryName: sub.subCategoryName,
                service: Array.from(sub.services.values())
            }))
        }));

        // Sort by name for better UX
        categories.sort((a, b) => a.serviceCategoryName.localeCompare(b.serviceCategoryName));

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        console.error('Error fetching service categories:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    getAllArtisans,
    triggerSync,
    triggerSyncForDates,
    getServiceCategories
};
