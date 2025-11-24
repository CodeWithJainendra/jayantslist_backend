const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAccount = sequelize.define('UserAccount', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    roles: {
        type: DataTypes.JSONB, // Assuming roles can be an array or object
        allowNull: true
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true
    },
    source_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'user_accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = UserAccount;
