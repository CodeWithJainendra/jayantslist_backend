require('dotenv').config();
const { pushCallStatsToVishwakarma } = require('../services/vishwakarmaService');
const pool = require('../db_config');
const { v4: uuidv4 } = require('uuid');


async function createDummyDataAndPush() {

    console.log(' Starting Test: Create Dummy Data & Push Stats');

    try {
        // 1. Find 5 random Vishwakarma users who have a Seller profile
        // We need users who are Sellers because calls are linked to Sellers
        const query = `
            SELECT s.id as seller_id, ua.source_id as artisan_id, ua.fullname
            FROM sellers s
            JOIN user_accounts ua ON s.user_account_id = ua.id
            WHERE ua.source = 'VISHWAKARMA' AND ua.source_id IS NOT NULL
            LIMIT 5
        `;

        const result = await pool.query(query);
        const sellers = result.rows;

        if (sellers.length === 0) {
            console.error('No Vishwakarma sellers found to create dummy data for.');
            process.exit(1);
        }

        console.log(`Found ${sellers.length} Vishwakarma sellers. Creating calls...`);

        // 2. Insert dummy calls for "Yesterday"
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        // We need a dummy service ID. Let's just pick one existing service or assume 1 if none.
        // For safety, let's check if any service exists, or insert a dummy one if needed?
        // Actually, UserAccountCall needs seller_service_id.
        // Let's find a valid seller_service_id for each seller, or just pick ANY valid seller_service_id
        // Wait, UserAccountCall links to SellerService.

        // Let's simplify: Just pick ANY 5 valid seller_service_ids that belong to these sellers?
        // Or better, just insert into user_account_calls directly if we have valid FKs.

        // Let's try to find valid seller_service_ids for these sellers.
        // If not found, we can't create calls easily without creating services first.

        // Alternative: Check if we can just use seller_id and put a dummy seller_service_id if FK constraint allows?
        // FK constraint is likely enforced.

        // Let's check if there are any seller_services.
        const serviceQuery = `SELECT id, seller_id FROM seller_services WHERE seller_id = ANY($1) LIMIT 5`;
        const sellerIds = sellers.map(s => s.seller_id);
        const serviceResult = await pool.query(serviceQuery, [sellerIds]);

        let services = serviceResult.rows;

        if (services.length === 0) {
            console.log(' No services found for these sellers. Checking ANY service...');
            // Fallback: Get ANY service ID just to satisfy FK (if schema allows mismatch, but likely not).
            // If strict schema, we must create a dummy service for one of the sellers.

            // Let's create a dummy service for the first seller
            const insertService = `
                INSERT INTO seller_services (seller_id, service_id, price, created_at, updated_at)
                VALUES ($1, 1, 100, NOW(), NOW())
                RETURNING id
             `;
            // Assuming service_id 1 exists in master services table? Or is it free text?
            // Let's assume we can just insert.
            // Wait, let's look at SellerService model. It likely links to a Service master table?
            // Or maybe it's just an ID.

            // To be safe, let's try to find ANY existing seller_service_id in the system.
            const anyService = await pool.query('SELECT id, seller_id FROM seller_services LIMIT 1');
            if (anyService.rows.length > 0) {
                services = anyService.rows;
                console.log(`Using existing service ID ${services[0].id} for dummy calls (might mismatch seller but good for testing if no strict cross-check)`);
            } else {
                console.error('No seller services found at all. Cannot create calls.');
                process.exit(1);
            }
        }

        // 3. Create Calls
        // We will distribute 5 calls among the found sellers/services
        let callsCreated = 0;

        for (let i = 0; i < 5; i++) {
            const seller = sellers[i % sellers.length];
            // Try to find a service for this seller, or use the first available service
            const service = services.find(s => s.seller_id === seller.seller_id) || services[0];

            // We also need a user_account_id for the CALLER.
            // Let's use the SAME user as caller for simplicity (self-call), or a dummy UUID.
            // UserAccountCall.user_account_id is the CALLER.
            const callerId = seller.seller_id; // Using seller's user_account_id? No, seller.seller_id is int.
            // We need UUID for user_account_id.
            // Let's fetch the UUID from sellers array (we didn't select it, let's fix query)

            // Re-querying to get user_account_id
            const uaQuery = `SELECT user_account_id FROM sellers WHERE id = $1`;
            const uaRes = await pool.query(uaQuery, [seller.seller_id]);
            const callerUuid = uaRes.rows[0].user_account_id;

            const insertCall = `
                INSERT INTO user_account_calls (user_account_id, seller_id, seller_service_id, created_at)
                VALUES ($1, $2, $3, $4)
            `;

            // Set created_at to yesterday
            await pool.query(insertCall, [callerUuid, seller.seller_id, service.id, yesterday]);
            callsCreated++;
            console.log(`Created call for Artisan ${seller.artisan_id} (Seller ${seller.seller_id})`);
        }

        console.log(`\n Created ${callsCreated} calls for date ${dateStr}`);

        // 4. Trigger Push
        console.log('\n Triggering Push to Vishwakarma API...');
        const pushResult = await pushCallStatsToVishwakarma(dateStr);

        console.log('\n----------------------------------------');
        console.log('PUSH RESULT:');
        console.log(JSON.stringify(pushResult, null, 2));
        console.log('----------------------------------------');

    } catch (error) {
        console.error(' Test Failed:', error);
    } finally {
        // pool.end(); // Don't close pool if script hangs, but for script it's fine.
        process.exit(0);
    }
}

createDummyDataAndPush();
