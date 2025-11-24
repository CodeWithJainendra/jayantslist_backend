const express = require('express');
const cors = require('cors');
const pool = require('./db_config');
const apiRoutes = require('./routes/api');
const vishwakarmaLogsRoutes = require('./routes/vishwakarmaLogs');
const startCronJobs = require('./jobs/cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes with base path for reverse proxy
app.use('/jayants-list-api/api', apiRoutes);
app.use('/jayants-list-api/api/vishwakarma/logs', vishwakarmaLogsRoutes);

// Health Check with base path
app.get('/jayants-list-api/', (req, res) => {
    res.send('Jayantslist Backend API is running');
});

// Also support direct access without base path (for local testing)
app.use('/api', apiRoutes);
app.use('/api/vishwakarma/logs', vishwakarmaLogsRoutes);
app.get('/', (req, res) => {
    res.send('Jayantslist Backend API is running');
});

// Import Models
const UserAccount = require('./models/UserAccount');
const Seller = require('./models/Seller');
const Category = require('./models/Category');
const SellerService = require('./models/SellerService');
const SellerServiceLocation = require('./models/SellerServiceLocation');
const SellerPost = require('./models/SellerPost');
const UserAccountPin = require('./models/UserAccountPin');
const UserAccountCall = require('./models/UserAccountCall');
const sequelize = require('./config/database');

// Start Server and Database
async function startServer() {
    try {
        // Test PostgreSQL connection
        await sequelize.authenticate();
        console.log('PostgreSQL connection established successfully.');

        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');

        // Verify tables exist
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'artisans'
        `);

        if (tableCheck.rows.length > 0) {
            console.log('Artisans table exists.');
        } else {
            console.log('  Artisans table not found');
        }

        // Start Cron Jobs
        startCronJobs();

        // Start Express Server
        app.listen(PORT, () => {
            console.log(`\n Server is running on port ${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/`);
            console.log(`   Artisans API: http://localhost:${PORT}/api/artisans`);
            console.log(`   Manual sync: POST http://localhost:${PORT}/api/sync`);
        });

    } catch (error) {
        console.error(' Unable to start server:', error);
        process.exit(1);
    }
}

startServer();
