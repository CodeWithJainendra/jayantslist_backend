const { syncArtisansByDate } = require('../services/vishwakarmaService');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Test script to fetch data for a specific date and save logs
 * Usage: node scripts/test_fetch_and_log.js [YYYY-MM-DD]
 */

async function fetchAndLogData(dateString) {
    const startTime = new Date();
    console.log(`\n=== Starting Data Fetch for ${dateString} ===`);
    console.log(`Start Time: ${startTime.toISOString()}\n`);

    try {
        // Fetch data for the specified date
        const result = await syncArtisansByDate(dateString);

        const endTime = new Date();
        const durationMs = endTime - startTime;
        const durationSeconds = (durationMs / 1000).toFixed(2);

        // Prepare log data
        const logData = {
            date: dateString,
            fetch_start_time: startTime.toISOString(),
            fetch_end_time: endTime.toISOString(),
            duration_seconds: parseFloat(durationSeconds),
            success: result.success,
            records_inserted: result.inserted || 0,
            records_updated: result.updated || 0,
            total_records_affected: (result.inserted || 0) + (result.updated || 0),
            error: result.error || null,
            timestamp: new Date().toISOString()
        };

        // Create log file name: data_log_YYYY-MM-DD.json
        const logFileName = `data_log_${dateString}.json`;
        const logFilePath = path.join(__dirname, '../Inserted_Data_logs', logFileName);

        // Check if log file already exists
        let existingLogs = [];
        try {
            const existingData = await fs.readFile(logFilePath, 'utf8');
            existingLogs = JSON.parse(existingData);
            if (!Array.isArray(existingLogs)) {
                existingLogs = [existingLogs];
            }
        } catch (error) {
            // File doesn't exist or is invalid, start fresh
            existingLogs = [];
        }

        // Append new log entry
        existingLogs.push(logData);

        // Save to file
        await fs.writeFile(logFilePath, JSON.stringify(existingLogs, null, 2), 'utf8');

        console.log(`\n=== Data Fetch Completed ===`);
        console.log(`End Time: ${endTime.toISOString()}`);
        console.log(`Duration: ${durationSeconds} seconds`);
        console.log(`Status: ${result.success ? 'SUCCESS ✓' : 'FAILED ✗'}`);
        console.log(`Records Inserted: ${result.inserted || 0}`);
        console.log(`Records Updated: ${result.updated || 0}`);
        console.log(`Total Affected: ${(result.inserted || 0) + (result.updated || 0)}`);
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        console.log(`\nLog saved to: ${logFilePath}\n`);

        return logData;

    } catch (error) {
        const endTime = new Date();
        const durationMs = endTime - startTime;
        const durationSeconds = (durationMs / 1000).toFixed(2);

        console.error(`\n=== Data Fetch FAILED ===`);
        console.error(`Error: ${error.message}`);
        console.error(`Duration: ${durationSeconds} seconds\n`);

        // Log the error
        const errorLogData = {
            date: dateString,
            fetch_start_time: startTime.toISOString(),
            fetch_end_time: endTime.toISOString(),
            duration_seconds: parseFloat(durationSeconds),
            success: false,
            records_inserted: 0,
            records_updated: 0,
            total_records_affected: 0,
            error: error.message,
            stack_trace: error.stack,
            timestamp: new Date().toISOString()
        };

        const logFileName = `data_log_${dateString}.json`;
        const logFilePath = path.join(__dirname, '../Inserted_Data_logs', logFileName);

        try {
            let existingLogs = [];
            try {
                const existingData = await fs.readFile(logFilePath, 'utf8');
                existingLogs = JSON.parse(existingData);
                if (!Array.isArray(existingLogs)) {
                    existingLogs = [existingLogs];
                }
            } catch {
                existingLogs = [];
            }

            existingLogs.push(errorLogData);
            await fs.writeFile(logFilePath, JSON.stringify(existingLogs, null, 2), 'utf8');
            console.log(`Error log saved to: ${logFilePath}\n`);
        } catch (logError) {
            console.error(`Failed to save error log: ${logError.message}`);
        }

        throw error;
    }
}

// Main execution
async function main() {
    // Get date from command line argument or use default (2025-11-21)
    const dateArg = process.argv[2];
    const targetDate = dateArg || '2025-11-21';

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
        console.error('Error: Invalid date format. Please use YYYY-MM-DD format.');
        process.exit(1);
    }

    try {
        await fetchAndLogData(targetDate);
        process.exit(0);
    } catch (error) {
        console.error('Script execution failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
