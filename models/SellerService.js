const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Seller = require('./Seller');
const Category = require('./Category');

const SellerService = sequelize.define('SellerService', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Seller,
            key: 'id'
        }
    },
    co_ordinates: {
        type: DataTypes.STRING, // Storing as string for now, could be JSON or Geometry
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Category,
            key: 'id'
        }
    }
}, {
    tableName: 'seller_services',
    timestamps: false // No created_at/updated_at specified for this table
});

// Define relationships
SellerService.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(SellerService, { foreignKey: 'seller_id' });

SellerService.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(SellerService, { foreignKey: 'category_id' });

module.exports = SellerService;
