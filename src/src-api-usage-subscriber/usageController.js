const path = require('path');
const fs = require('fs');
const { usageServices, UsageServiceError } = require('./usageServices');
const { exportUsageToCsv, listExportedCsvFiles, EXPORT_DIR } = require('../cron/usageCron');

/**
 * Controller layer for Usage Subscriber analytics.
 * Handles HTTP request/response for usage endpoints.
 */
const usageController = {
  /**
   * POST /api/usage-subscribers
   * Create a new usage record for a subscriber.
   * Body fields: subscriberId, callMinutes, smsCount, dataUsageMB, timestamp
   */
  async createUsageSubscriber(req, res, next) {
    try {
      const newUsage = await usageServices.createUsageSubscriber(req.body);

      return res.status(201).json({
        success: true,
        message: 'Usage subscriber record created successfully',
        data: newUsage,
      });
    } catch (error) {
      if (error instanceof UsageServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Error in createUsageSubscriber:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error while creating usage subscriber: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers
   * Retrieve recent usage records.
   */
  async getRecentUsage(req, res, next) {
    try {
      const usageList = await usageServices.getRecentUsage();

      return res.status(200).json({
        success: true,
        message: 'Recent usage records retrieved successfully',
        data: usageList,
      });
    } catch (error) {
      console.error('Error in getRecentUsage:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error while fetching usage records: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers/premium-data
   * Retrieve top 3 premium data usage records.
   */
  async getPremiumDataUsage(req, res, next) {
    try {
      const usageList = await usageServices.getPremiumDataUsage();

      return res.status(200).json({
        success: true,
        message: 'Top 3 premium data usage records retrieved successfully',
        data: usageList,
      });
    } catch (error) {
      console.error('Error in getPremiumDataUsage:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error while fetching premium data usage records: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers/data-usage-premium
   * Calculate data usage premium.
   */
  async calculateDataUsagePremium(req, res, next) {
    try {
      const totalDataUsageMB = await usageServices.calculateDataUsagePremium();

      return res.status(200).json({
        success: true,
        message: 'Data usage premium calculated successfully',
        totalDataUsageMB,
      });
    } catch (error) {
      console.error('Error in calculateDataUsagePremium:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error while calculating data usage premium: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers/call-minutes-low-usage
   * Calculate call minutes low usage.
   */
  async calculateCallMinutesLowUsage(req, res, next) {
    try {
      const totalCallMinutesLowUsage = await usageServices.calculateCallMinutesLowUsage();

      return res.status(200).json({
        success: true,
        message: 'Subscribers with average call duration ≤ 30 minutes retrieved successfully.',
        data: totalCallMinutesLowUsage,
      });
    } catch (error) {
      console.error('Error in calculateCallMinutesLowUsage:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error while calculating call minutes low usage: ${error.message}`,
      });
    }
  },

  /**
   * POST /api/usage-subscribers/export-csv
   * Trigger manual CSV export of usage data.
   */
  async manualExportCsv(req, res, next) {
    try {
      const exportMeta = await exportUsageToCsv();
      return res.status(200).json({
        success: true,
        message: `CSV export completed successfully (${exportMeta.rowCount} records)`,
        data: exportMeta,
      });
    } catch (error) {
      console.error('Error in manualExportCsv:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error during CSV export: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers/csv-files
   * List all generated CSV files in src/csv-exports.
   */
  async listCsvFiles(req, res, next) {
    try {
      const files = listExportedCsvFiles();
      return res.status(200).json({
        success: true,
        message: 'CSV export files retrieved successfully',
        data: files,
      });
    } catch (error) {
      console.error('Error in listCsvFiles:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error listing CSV files: ${error.message}`,
      });
    }
  },

  /**
   * GET /api/usage-subscribers/download-csv/:filename
   * Download a specific CSV export file.
   */
  async downloadCsvFile(req, res, next) {
    try {
      const { filename } = req.params;
      // Prevent directory traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(EXPORT_DIR, safeFilename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: `CSV file '${safeFilename}' not found`,
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      return res.sendFile(filePath);
    } catch (error) {
      console.error('Error in downloadCsvFile:', error.message);
      return res.status(500).json({
        success: false,
        message: `Internal server error downloading CSV: ${error.message}`,
      });
    }
  },
};

module.exports = usageController;
