const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artisan = sequelize.define('Artisan', {
    artisanId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: 'artisan_id'
    },
    artisanName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'artisan_name'
    },
    contactNo: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'contact_no'
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'contact_email'
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lattitude: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'latitude' // Note: DB likely has 'latitude', but code uses 'lattitude'. Let's check DB schema from previous raw query.
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    serviceCategory: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'service_category'
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'artisans',
    timestamps: false
});

module.exports = Artisan;
