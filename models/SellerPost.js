const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Seller = require('./Seller');

const SellerPost = sequelize.define('SellerPost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Seller,
            key: 'id'
        }
    },
    filepath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    caption: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    media_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('CREATED', 'UPLOADED'),
        defaultValue: 'CREATED'
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'seller_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enables soft deletes (deletedAt)
    deletedAt: 'deleted_at'
});

// Define relationship
SellerPost.belongsTo(Seller, { foreignKey: 'seller_id' });
Seller.hasMany(SellerPost, { foreignKey: 'seller_id' });

module.exports = SellerPost;
