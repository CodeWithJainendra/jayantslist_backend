const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SellerService = require('./SellerService');

const SellerServiceLocation = sequelize.define('SellerServiceLocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    seller_service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SellerService,
            key: 'id'
        }
    },
    latitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'seller_service_locations',
    timestamps: false // Only created_at is specified
});

// Define relationship
SellerServiceLocation.belongsTo(SellerService, { foreignKey: 'seller_service_id' });
SellerService.hasMany(SellerServiceLocation, { foreignKey: 'seller_service_id' });

module.exports = SellerServiceLocation;
