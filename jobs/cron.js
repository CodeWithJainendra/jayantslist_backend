const cron = require('node-cron');
const { syncArtisans } = require('../services/vishwakarmaService');
require('dotenv').config();

const schedule = process.env.CRON_SCHEDULE || '0 0 * * *'; // Default to 2 AM daily

function startCronJobs() {
    console.log(`Initializing Cron Jobs with schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
        console.log('Running scheduled Artisan Sync...');
        await syncArtisans();
    });
}

module.exports = startCronJobs;
