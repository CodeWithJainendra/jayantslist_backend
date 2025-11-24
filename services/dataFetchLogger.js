const fs = require('fs').promises;
const path = require('path');

/**
 * Centralized Data Fetch Logger
 * Logs all Vishwakarma API data fetch operations with timestamps
 */

const LOG_DIR = path.join(__dirname, '../Inserted_Data_logs');
const MASTER_LOG_FILE = path.join(LOG_DIR, 'vishwakarma_fetch_history.json');

class DataFetchLogger {
    constructor() {
        this.currentSession = null;
    }

    /**
     * Start a new fetch session
     */
    async startSession(dateToFetch, triggeredBy = 'MANUAL') {
        this.currentSession = {
            session_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            triggered_by: triggeredBy, // 'CRON' or 'MANUAL'
            target_date: dateToFetch,
            start_time: new Date().toISOString(),
            start_timestamp: Date.now(),
            end_time: null,
            duration_seconds: null,
            status: 'IN_PROGRESS',
            records_inserted: 0,
            records_updated: 0,
            total_records: 0,
            pages_fetched: 0,
            error: null,
            error_details: null
        };

        console.log(` [DataFetchLogger] Session started: ${this.currentSession.session_id}`);
        console.log(`   Target Date: ${dateToFetch} | Triggered By: ${triggeredBy}`);

        return this.currentSession.session_id;
    }

    /**
     * Update session with page fetch info
     */
    updatePageFetch(pageNumber) {
        if (this.currentSession) {
            this.currentSession.pages_fetched = pageNumber;
        }
    }

    /**
     * Update session with record counts
     */
    updateRecords(inserted, updated) {
        if (this.currentSession) {
            this.currentSession.records_inserted += inserted;
            this.currentSession.records_updated += updated;
            this.currentSession.total_records = this.currentSession.records_inserted + this.currentSession.records_updated;
        }
    }

    /**
     * End the current session with success
     */
    async endSessionSuccess() {
        if (!this.currentSession) {
            console.warn(' [DataFetchLogger] No active session to end');
            return;
        }

        const endTime = new Date();
        this.currentSession.end_time = endTime.toISOString();
        this.currentSession.duration_seconds = parseFloat(((Date.now() - this.currentSession.start_timestamp) / 1000).toFixed(2));
        this.currentSession.status = 'SUCCESS';

        await this.saveLog();

        console.log(` [DataFetchLogger] Session completed successfully`);
        console.log(`   Duration: ${this.currentSession.duration_seconds}s | Records: ${this.currentSession.total_records}`);

        this.currentSession = null;
    }

    /**
     * End the current session with error
     */
    async endSessionError(error) {
        if (!this.currentSession) {
            console.warn(' [DataFetchLogger] No active session to end');
            return;
        }

        const endTime = new Date();
        this.currentSession.end_time = endTime.toISOString();
        this.currentSession.duration_seconds = parseFloat(((Date.now() - this.currentSession.start_timestamp) / 1000).toFixed(2));
        this.currentSession.status = 'FAILED';
        this.currentSession.error = error.message;
        this.currentSession.error_details = error.stack;

        await this.saveLog();

        console.log(`[DataFetchLogger] Session failed: ${error.message}`);

        this.currentSession = null;
    }

    /**
     * Save log to master log file
     */
    async saveLog() {
        try {
            // Ensure log directory exists
            await fs.mkdir(LOG_DIR, { recursive: true });

            // Read existing logs
            let logs = [];
            try {
                const existingData = await fs.readFile(MASTER_LOG_FILE, 'utf8');
                logs = JSON.parse(existingData);
                if (!Array.isArray(logs)) {
                    logs = [logs];
                }
            } catch (error) {
                // File doesn't exist or is invalid, start fresh
                logs = [];
            }

            // Add current session to logs
            logs.push({ ...this.currentSession });

            // Keep only last 1000 entries to prevent file from growing too large
            if (logs.length > 1000) {
                logs = logs.slice(-1000);
            }

            // Save to file
            await fs.writeFile(MASTER_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');

            console.log(` [DataFetchLogger] Log saved to: ${MASTER_LOG_FILE}`);

        } catch (error) {
            console.error(` [DataFetchLogger] Failed to save log:`, error.message);
        }
    }

    /**
     * Get fetch history for a specific date
     */
    async getHistoryForDate(date) {
        try {
            const data = await fs.readFile(MASTER_LOG_FILE, 'utf8');
            const logs = JSON.parse(data);
            return logs.filter(log => log.target_date === date);
        } catch (error) {
            return [];
        }
    }

    /**
     * Get recent fetch history
     */
    async getRecentHistory(limit = 10) {
        try {
            const data = await fs.readFile(MASTER_LOG_FILE, 'utf8');
            const logs = JSON.parse(data);
            return logs.slice(-limit).reverse();
        } catch (error) {
            return [];
        }
    }

    /**
     * Get summary statistics
     */
    async getSummary() {
        try {
            const data = await fs.readFile(MASTER_LOG_FILE, 'utf8');
            const logs = JSON.parse(data);

            const summary = {
                total_fetch_operations: logs.length,
                successful_fetches: logs.filter(l => l.status === 'SUCCESS').length,
                failed_fetches: logs.filter(l => l.status === 'FAILED').length,
                total_records_inserted: logs.reduce((sum, l) => sum + (l.records_inserted || 0), 0),
                total_records_updated: logs.reduce((sum, l) => sum + (l.records_updated || 0), 0),
                cron_triggered: logs.filter(l => l.triggered_by === 'CRON').length,
                manual_triggered: logs.filter(l => l.triggered_by === 'MANUAL').length,
                last_fetch: logs.length > 0 ? logs[logs.length - 1] : null
            };

            return summary;
        } catch (error) {
            return null;
        }
    }
}

// Export a singleton instance
module.exports = new DataFetchLogger();
