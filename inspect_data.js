const pool = require('./db_config');
require('dotenv').config();

async function inspectData() {
    try {
        const result = await pool.query('SELECT * FROM artisans LIMIT 5');
        console.log('Artisans Data:', JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        pool.end();
    }
}

inspectData();
