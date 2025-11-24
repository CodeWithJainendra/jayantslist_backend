const dataFetchLogger = require('../services/dataFetchLogger');
const { syncArtisansByDate, pushCallStatsToVishwakarma } = require('../services/vishwakarmaService');

/**
 * Manually trigger call stats push to Vishwakarma API
 * POST /api/vishwakarma/logs/push-stats
 * Body: { "date": "YYYY-MM-DD" } (optional, defaults to yesterday)
 */
const triggerManualPushStats = async (req, res) => {
    try {
        let date = req.body.date;

        if (!date) {
            // Default to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            date = yesterday.toISOString().split('T')[0];
        } else {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid date format. Use YYYY-MM-DD format'
                });
            }
        }

        console.log(`[API] Manual push stats triggered for ${date}`);

        const result = await pushCallStatsToVishwakarma(date);

        if (result.success) {
            return res.status(200).json({
                status: 'success',
                message: 'Push completed successfully',
                data: result
            });
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Push failed',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error triggering manual push:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to trigger push',
            error: error.message
        });
    }
};

/**
 * Manually trigger sync and return stats
 * POST /api/vishwakarma/logs/sync
 * Body: { "date": "YYYY-MM-DD" } (optional, defaults to yesterday)
 */
const triggerManualSync = async (req, res) => {
    try {
        let date = req.body.date;

        if (!date) {
            // Default to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            date = yesterday.toISOString().split('T')[0];
        } else {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid date format. Use YYYY-MM-DD format'
                });
            }
        }

        console.log(`[API] Manual sync triggered for ${date}`);

        // Trigger sync and wait for result
        const result = await syncArtisansByDate(date, 'API_MANUAL');

        if (result.success) {
            return res.status(200).json({
                status: 'success',
                message: 'Sync completed successfully',
                data: {
                    date: result.date,
                    inserted: result.inserted,
                    updated: result.updated,
                    total_affected: result.inserted + result.updated
                }
            });
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Sync failed',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error triggering manual sync:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to trigger sync',
            error: error.message
        });
    }
};

/**
 * Get summary statistics of all Vishwakarma API fetch operations
 * GET /api/vishwakarma/logs/summary
 */
const getSummary = async (req, res) => {
    try {
        const summary = await dataFetchLogger.getSummary();

        if (!summary) {
            return res.status(200).json({
                status: 'success',
                message: 'No fetch operations found',
                data: {
                    total_fetch_operations: 0,
                    successful_fetches: 0,
                    failed_fetches: 0,
                    total_records_inserted: 0,
                    total_records_updated: 0,
                    cron_triggered: 0,
                    manual_triggered: 0,
                    last_fetch: null
                }
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Summary retrieved successfully',
            data: summary
        });
    } catch (error) {
        console.error('Error getting summary:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve summary',
            error: error.message
        });
    }
};

/**
 * Get recent fetch history
 * GET /api/vishwakarma/logs/recent?limit=20
 */
const getRecentLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                status: 'error',
                message: 'Limit must be between 1 and 100'
            });
        }

        const logs = await dataFetchLogger.getRecentHistory(limit);

        return res.status(200).json({
            status: 'success',
            message: `Retrieved ${logs.length} recent fetch operations`,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Error getting recent logs:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve recent logs',
            error: error.message
        });
    }
};

/**
 * Get fetch history for a specific date
 * GET /api/vishwakarma/logs/date/:date
 * Example: /api/vishwakarma/logs/date/2025-11-23
 */
const getLogsByDate = async (req, res) => {
    try {
        const { date } = req.params;

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid date format. Use YYYY-MM-DD format'
            });
        }

        const logs = await dataFetchLogger.getHistoryForDate(date);

        return res.status(200).json({
            status: 'success',
            message: `Retrieved ${logs.length} fetch operations for ${date}`,
            date: date,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Error getting logs by date:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve logs for the specified date',
            error: error.message
        });
    }
};

/**
 * Get comprehensive report with summary and recent operations
 * GET /api/vishwakarma/logs/report
 */
const getComprehensiveReport = async (req, res) => {
    try {
        const summary = await dataFetchLogger.getSummary();
        const recentLogs = await dataFetchLogger.getRecentHistory(10);

        // Calculate success rate
        const successRate = summary && summary.total_fetch_operations > 0
            ? ((summary.successful_fetches / summary.total_fetch_operations) * 100).toFixed(2)
            : 0;

        const report = {
            generated_at: new Date().toISOString(),
            summary: summary || {
                total_fetch_operations: 0,
                successful_fetches: 0,
                failed_fetches: 0,
                total_records_inserted: 0,
                total_records_updated: 0,
                cron_triggered: 0,
                manual_triggered: 0
            },
            metrics: {
                success_rate: `${successRate}%`,
                total_records_processed: summary
                    ? summary.total_records_inserted + summary.total_records_updated
                    : 0
            },
            recent_operations: recentLogs,
            last_fetch: summary?.last_fetch || null
        };

        return res.status(200).json({
            status: 'success',
            message: 'Comprehensive report generated successfully',
            data: report
        });
    } catch (error) {
        console.error('Error generating report:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to generate comprehensive report',
            error: error.message
        });
    }
};

module.exports = {
    triggerManualSync,
    triggerManualPushStats,
    getSummary,
    getRecentLogs,
    getLogsByDate,
    getComprehensiveReport
};
