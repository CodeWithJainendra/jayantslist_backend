const cron = require('node-cron');
const { syncArtisans, pushCallStatsToVishwakarma } = require('../services/vishwakarmaService');

// Schedule tasks to be run on the server.
// Run daily at midnight (00:00)
const schedule = '0 0 * * *';

// Run daily at 1:00 AM for pushing stats
const pushStatsSchedule = '0 1 * * *';

function startCronJobs() {
    console.log(`Initializing Cron Jobs...`);

    // 1. Sync Artisans (Midnight)
    cron.schedule(schedule, async () => {
        console.log('Running scheduled Artisan Sync...');
        await syncArtisans();
    });

    // 2. Push Call Stats (1:00 AM)
    cron.schedule(pushStatsSchedule, async () => {
        console.log('Running scheduled Call Stats Push...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        await pushCallStatsToVishwakarma(dateStr);
    });
}

module.exports = startCronJobs;
