const pool = require('../config/db');
const usageQuery = require('./usageQuery');

/**
 * Repository layer for Usage Subscriber analytics and data operations.
 * Executes queries through the shared PostgreSQL connection pool.
 */
const usageRepository = {
  /**
   * Create a new usage snapshot record.
   * @param {Object} data
   * @returns {Promise<Object>} Created usage record.
   */
  async create({ subscriberId, callMinutes, smsCount, dataUsageMB, timestamp }) {
    const values = [
      subscriberId,
      callMinutes || 0,
      smsCount || 0,
      dataUsageMB,
      timestamp,
    ];
    const { rows } = await pool.query(usageQuery.create, values);
    return rows[0];
  },

  /**
   * Retrieve recent usage records.
   * @returns {Promise<Array>}
   */
  async findRecent() {
    const { rows } = await pool.query(usageQuery.findRecent);
    return rows;
  },

  /**
   * Retrieve top 3 premium data usage records.
   * @returns {Promise<Array>}
   */
  async getPremiumDataUsage() {
    const { rows } = await pool.query(usageQuery.getPremiumDataUsage);
    return rows;
  },

  /**
   * Calculate data usage premium.
   * @returns {Promise<Object>}
   */
  async calculateDataUsagePremium() {
    const { rows } = await pool.query(usageQuery.calculateDataUsagePremium);
    return rows[0];
  },

  /**
   * Calculate call minutes low usage.
   * @returns {Promise<Array>}
   */
  async calculateCallMinutesLowUsage() {
    const { rows } = await pool.query(usageQuery.calculateCallMinutesLowUsage);
    return rows;
  }

};

module.exports = usageRepository;
