const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categories', // Self-reference
            key: 'id'
        }
    },
    hcode: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Hierarchy code Ex: A.B.C'
    }
}, {
    tableName: 'categories',
    timestamps: false // No created_at/updated_at specified in requirements for this table
});

// Define self-referencing relationship
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

module.exports = Category;
