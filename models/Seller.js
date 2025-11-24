const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserAccount = require('./UserAccount');

const Seller = sequelize.define('Seller', {
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
    fullname: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'sellers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define relationship
Seller.belongsTo(UserAccount, { foreignKey: 'user_account_id' });
UserAccount.hasOne(Seller, { foreignKey: 'user_account_id' });

module.exports = Seller;
