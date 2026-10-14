const express = require('express');
const router = express.Router();
const usageController = require('./usageController');

/**
 * Routes for Huawei Usage Subscriber Analytics & Operations
 * Mounted at: /api/usage-subscribers
 */

// POST /api/usage-subscribers - Create a new usage snapshot record
router.post('/', usageController.createUsageSubscriber);

// GET /api/usage-subscribers - Get recent usage records
router.get('/', usageController.getRecentUsage);

// GET /api/usage-subscribers/premium-data - Get top 3 premium data usage records
router.get('/premium-data', usageController.getPremiumDataUsage);

// GET /api/usage-subscribers/data-usage-premium - Calculate data usage premium
router.get('/data-usage-premium', usageController.calculateDataUsagePremium);

// GET /api/usage-subscribers/call-minutes-low-usage - Calculate call minutes low usage
router.get('/call-minutes-low-usage', usageController.calculateCallMinutesLowUsage);

// CSV Export & Management Routes
// POST /api/usage-subscribers/export-csv - Trigger manual CSV export
router.post('/export-csv', usageController.manualExportCsv);

// GET /api/usage-subscribers/csv-files - List all generated CSV files
router.get('/csv-files', usageController.listCsvFiles);

// GET /api/usage-subscribers/download-csv/:filename - Download specific CSV file
router.get('/download-csv/:filename', usageController.downloadCsvFile);

module.exports = router;
