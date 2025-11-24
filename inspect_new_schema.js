const sequelize = require('./config/database');
const UserAccount = require('./models/UserAccount');
const Seller = require('./models/Seller');
const Category = require('./models/Category');
const SellerService = require('./models/SellerService');
const SellerServiceLocation = require('./models/SellerServiceLocation');
const SellerPost = require('./models/SellerPost');
const UserAccountPin = require('./models/UserAccountPin');
const UserAccountCall = require('./models/UserAccountCall');

async function inspectNewSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const users = await UserAccount.findAll();
        console.log('\n=== UserAccounts ===');
        console.log(JSON.stringify(users, null, 2));

        const sellers = await Seller.findAll();
        console.log('\n=== Sellers ===');
        console.log(JSON.stringify(sellers, null, 2));

        const categories = await Category.findAll();
        console.log('\n=== Categories ===');
        console.log(JSON.stringify(categories, null, 2));

        const services = await SellerService.findAll();
        console.log('\n=== SellerServices ===');
        console.log(JSON.stringify(services, null, 2));

        const locations = await SellerServiceLocation.findAll();
        console.log('\n=== SellerServiceLocations ===');
        console.log(JSON.stringify(locations, null, 2));

        const posts = await SellerPost.findAll();
        console.log('\n=== SellerPosts ===');
        console.log(JSON.stringify(posts, null, 2));

        const pins = await UserAccountPin.findAll();
        console.log('\n=== UserAccountPins ===');
        console.log(JSON.stringify(pins, null, 2));

        const calls = await UserAccountCall.findAll();
        console.log('\n=== UserAccountCalls ===');
        console.log(JSON.stringify(calls, null, 2));

    } catch (error) {
        console.error('Error inspecting data:', error);
    } finally {
        await sequelize.close();
    }
}

inspectNewSchema();
