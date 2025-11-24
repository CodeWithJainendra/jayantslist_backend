const sequelize = require('../config/database');
const UserAccount = require('../models/UserAccount');
const Seller = require('../models/Seller');
const Category = require('../models/Category');
const SellerService = require('../models/SellerService');
const SellerServiceLocation = require('../models/SellerServiceLocation');

async function inspectData() {
    try {
        await sequelize.authenticate();
        console.log('--- Inspecting Migrated Data ---\n');

        // 1. Fetch a sample UserAccount with Seller details
        const user = await UserAccount.findOne({
            where: { source: 'VISHWAKARMA' },
            logging: false
        });

        if (!user) {
            console.log('No UserAccount found.');
            return;
        }

        console.log('1. UserAccount:');
        console.log(JSON.stringify(user.toJSON(), null, 2));

        // Fetch Seller if not included
        let seller = null;
        if (user.seller) {
            seller = user.seller;
        } else {
            seller = await Seller.findOne({ where: { user_account_id: user.id }, logging: false });
            console.log('\n2. Seller (Linked to User):');
            console.log(JSON.stringify(seller.toJSON(), null, 2));
        }

        if (seller) {
            // 3. Fetch Seller Services
            const services = await SellerService.findAll({
                where: { seller_id: seller.id },
                logging: false
            });

            console.log(`\n3. Seller Services (Found ${services.length}):`);
            for (const service of services) {
                console.log(`  - Service: ${service.name} (ID: ${service.id})`);

                // 4. Fetch Category for this service
                const category = await Category.findByPk(service.category_id, { logging: false });
                if (category) {
                    console.log(`    Category (L3): ${category.name} (HCode: ${category.hcode})`);

                    // Fetch Parent Categories
                    if (category.parent_id) {
                        const subCat = await Category.findByPk(category.parent_id, { logging: false });
                        console.log(`    -> Parent (L2): ${subCat.name} (HCode: ${subCat.hcode})`);

                        if (subCat.parent_id) {
                            const rootCat = await Category.findByPk(subCat.parent_id, { logging: false });
                            console.log(`    -> Root (L1): ${rootCat.name} (HCode: ${rootCat.hcode})`);
                        }
                    }
                }

                // 5. Fetch Location
                const location = await SellerServiceLocation.findOne({
                    where: { seller_service_id: service.id },
                    logging: false
                });
                if (location) {
                    console.log(`    Location: Lat ${location.latitude}, Long ${location.longitude}`);
                }
            }
        }

    } catch (error) {
        console.error('Error inspecting data:', error);
    } finally {
        await sequelize.close();
    }
}

inspectData();
