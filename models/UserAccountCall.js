const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserAccount = require('./UserAccount');
const Seller = require('./Seller');
const SellerService = require('./SellerService');

const UserAccountCall = sequelize.define('UserAccountCall', {
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
    seller_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SellerService,
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_account_calls',
    timestamps: false // Only created_at is specified
});

// Define relationships
UserAccountCall.belongsTo(UserAccount, { foreignKey: 'user_account_id' });
UserAccount.hasMany(UserAccountCall, { foreignKey: 'user_account_id' });

UserAccountCall.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(UserAccountCall, { foreignKey: 'seller_id' });

UserAccountCall.belongsTo(SellerService, { foreignKey: 'seller_service_id' });
SellerService.hasMany(UserAccountCall, { foreignKey: 'seller_service_id' });

module.exports = UserAccountCall;
