const sequelize = require('./config/database');
const UserAccount = require('./models/UserAccount');
const Seller = require('./models/Seller');
const Category = require('./models/Category');
const SellerService = require('./models/SellerService');
const SellerServiceLocation = require('./models/SellerServiceLocation');
const SellerPost = require('./models/SellerPost');
const UserAccountPin = require('./models/UserAccountPin');
const UserAccountCall = require('./models/UserAccountCall');

async function clearUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Delete in order to respect foreign key constraints
        console.log('\nDeleting UserAccountCalls...');
        const callsDeleted = await UserAccountCall.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${callsDeleted} calls`);

        console.log('\nDeleting UserAccountPins...');
        const pinsDeleted = await UserAccountPin.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${pinsDeleted} pins`);

        console.log('\nDeleting SellerPosts...');
        const postsDeleted = await SellerPost.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${postsDeleted} posts`);

        console.log('\nDeleting SellerServiceLocations...');
        const locationsDeleted = await SellerServiceLocation.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${locationsDeleted} locations`);

        console.log('\nDeleting SellerServices...');
        const servicesDeleted = await SellerService.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${servicesDeleted} services`);

        console.log('\nDeleting Sellers...');
        const sellersDeleted = await Seller.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${sellersDeleted} sellers`);

        console.log('\nDeleting UserAccounts...');
        const usersDeleted = await UserAccount.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${usersDeleted} users`);

        console.log('\nDeleting Categories...');
        const categoriesDeleted = await Category.destroy({ where: {}, truncate: false, force: true });
        console.log(`Deleted ${categoriesDeleted} categories`);

        console.log('\n All user data cleared successfully!');

    } catch (error) {
        console.error('Error clearing users:', error);
    } finally {
        await sequelize.close();
    }
}

clearUsers();
