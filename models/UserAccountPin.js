const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserAccount = require('./UserAccount');
const Seller = require('./Seller');

const UserAccountPin = sequelize.define('UserAccountPin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: UserAccount,
            key: 'id'
        }
    },
    seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Seller,
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_account_pins',
    timestamps: false // Only created_at is specified
});

// Define relationships
UserAccountPin.belongsTo(UserAccount, { foreignKey: 'user_account_id' });
UserAccount.hasMany(UserAccountPin, { foreignKey: 'user_account_id' });

UserAccountPin.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(UserAccountPin, { foreignKey: 'seller_id' });

module.exports = UserAccountPin;
