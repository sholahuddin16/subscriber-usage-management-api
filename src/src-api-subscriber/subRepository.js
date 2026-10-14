const pool = require('../config/db');
const subQuery = require('./subQuery');

/**
 * Repository layer for Huawei Subscriber management.
 * Interacts directly with PostgreSQL connection pool.
 */
const subRepository = {
  /**
   * Retrieve all subscribers from the database.
   * @returns {Promise<Array>} Array of subscriber records.
   */
  async findAll() {
    const { rows } = await pool.query(subQuery.findAll);
    return rows;
  },

  /**
   * Retrieve all plan subscribers from the database.
   * @returns {Promise<Array>} Array of subscriber plan records.
   */
  async findAllPlan() {
    const { rows } = await pool.query(subQuery.planSub);
    return rows;
  },

  /**
   * Retrieve a single subscriber by primary key.
   * @param {number|string} pkId - pk_huawei_subscriber_id
   * @returns {Promise<Object|null>} Subscriber record or null if not found.
   */
  async findById(pkId) {
    const { rows } = await pool.query(subQuery.findById, [pkId]);
    return rows[0] || null;
  },

  /**
   * Insert a new subscriber into the database.
   * @param {Object} subscriberData
   * @returns {Promise<Object>} The newly created subscriber record.
   */
  async create({ id, name, plan, activation_date, created_date }) {
    const values = [
      id,
      name,
      plan,
      activation_date || null,
      created_date || null,
    ];
    const { rows } = await pool.query(subQuery.create, values);
    return rows[0];
  },

  /**
   * Update an existing subscriber by primary key.
   * @param {number|string} pkId - pk_huawei_subscriber_id
   * @param {Object} updateData
   * @returns {Promise<Object|null>} The updated subscriber record or null if not found.
   */
  async update(pkId, { id, name, plan, activation_date }) {
    const values = [
      id !== undefined ? id : null,
      name !== undefined ? name : null,
      plan !== undefined ? plan : null,
      activation_date !== undefined ? activation_date : null,
      pkId,
    ];
    const { rows } = await pool.query(subQuery.update, values);
    return rows[0] || null;
  },

  /**
   * Delete a subscriber by primary key.
   * @param {number|string} pkId - pk_huawei_subscriber_id
   * @returns {Promise<Object|null>} The deleted subscriber record or null if not found.
   */
  async deleteById(pkId) {
    const { rows } = await pool.query(subQuery.deleteById, [pkId]);
    return rows[0] || null;
  },
};

module.exports = subRepository;
