const axios = require('axios');

// ==========================================
// ⚙️  CONFIGURATION
// ==========================================
const CONFIG = {
    // Date to fetch data for (YYYY-MM-DD)
    DATE: '2025-11-23',

    // API Endpoint URL
    API_URL: 'http://localhost:9003/jayants-list-api/api/vishwakarma/logs/stats'
};
// ==========================================

async function triggerSync() {
    console.log(`\n Triggering Sync via API...`);
    console.log(`Date: ${CONFIG.DATE}`);
    console.log(` URL:  ${CONFIG.API_URL}\n`);

    try {
        const startTime = Date.now();

        const response = await axios.post(CONFIG.API_URL, {
            date: CONFIG.DATE
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(` Success! (${duration}s)`);
        console.log('----------------------------------------');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('----------------------------------------');

    } catch (error) {
        console.error(`\n Failed!`);
        if (error.response) {
            // Server responded with a status code outside 2xx
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received from server');
        } else {
            // Something happened in setting up the request
            console.error('Error:', error.message);
        }
    }
}

// Run the function
triggerSync();
