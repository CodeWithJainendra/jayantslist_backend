const UserAccount = require('./models/UserAccount');
const sequelize = require('./config/database');

async function createDummyUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const [user, created] = await UserAccount.findOrCreate({
            where: { mobile: '9876543210' },
            defaults: {
                fullname: 'Test User',
                mobile: '9876543210',
                roles: ['user']
            }
        });

        if (created) {
            console.log('Dummy user created:', user.toJSON());
        } else {
            console.log('Dummy user already exists:', user.toJSON());
        }

    } catch (error) {
        console.error('Error creating dummy user:', error);
    } finally {
        await sequelize.close();
    }
}

createDummyUser();
