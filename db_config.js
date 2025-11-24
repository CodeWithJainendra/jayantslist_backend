const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.USER, // Connect as the current system user
    host: 'localhost',
    database: 'project_db',
    password: '', // No password needed for local trust auth
    // port: 5440,
    port: 5434,
});

module.exports = pool;
