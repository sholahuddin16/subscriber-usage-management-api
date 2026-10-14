const subRepository = require('./subRepository');

/**
 * Custom error class for service-level business logic and validation errors.
 */
class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Validate date string format YYYY-MM-DD.
 * @param {string} dateString 
 * @returns {boolean}
 */
const isValidDateFormat = (dateString) => {
  if (typeof dateString !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/**
 * Helper to validate primary key parameter.
 * @param {any} id 
 * @returns {number}
 */
const validatePkId = (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ServiceError('Subscriber ID must be a valid positive integer', 400);
  }
  return numericId;
};

const subServices = {
  /**
   * Get all subscribers.
   * @returns {Promise<Array>}
   */
  async getAllSubscribers() {
    return await subRepository.findAll();
  },

  /**
   * Get all plan subscribers.
   * @returns {Promise<Array>}
   */
  async getAllPlanSub() {
    return await subRepository.findAllPlan();
  },

  /**
   * Get subscriber detail by primary key.
   * @param {string|number} id - pk_huawei_subscriber_id
   * @returns {Promise<Object>}
   */
  async getSubscriberById(id) {
    const pkId = validatePkId(id);
    const subscriber = await subRepository.findById(pkId);
    if (!subscriber) {
      throw new ServiceError(`Subscriber with ID ${pkId} not found`, 404);
    }
    return subscriber;
  },

  /**
   * Create a new subscriber with validation.
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async createSubscriber(data) {
    const { id, name, plan, activation_date, created_date } = data;

    // Validate required fields
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ServiceError("Field 'id' is required and must be a non-empty string", 400);
    }
    if (id.trim().length > 50) {
      throw new ServiceError("Field 'id' must not exceed 50 characters", 400);
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new ServiceError("Field 'name' is required and must be a non-empty string", 400);
    }
    if (name.trim().length > 50) {
      throw new ServiceError("Field 'name' must not exceed 50 characters", 400);
    }

    if (!plan || typeof plan !== 'string' || plan.trim() === '') {
      throw new ServiceError("Field 'plan' is required and must be a non-empty string", 400);
    }
    if (plan.trim().length > 50) {
      throw new ServiceError("Field 'plan' must not exceed 50 characters", 400);
    }

    // Validate activation_date if provided
    if (activation_date !== undefined && activation_date !== null && activation_date !== '') {
      if (!isValidDateFormat(activation_date)) {
        throw new ServiceError("Field 'activation_date' must be in YYYY-MM-DD format", 400);
      }
    }

    // Validate created_date if provided
    if (created_date !== undefined && created_date !== null && created_date !== '') {
      const parsedDate = new Date(created_date);
      if (isNaN(parsedDate.getTime())) {
        throw new ServiceError("Field 'created_date' must be a valid ISO timestamp or date string", 400);
      }
    }

    return await subRepository.create({
      id: id.trim(),
      name: name.trim(),
      plan: plan.trim(),
      activation_date: activation_date || null,
      created_date: created_date || null,
    });
  },

  /**
   * Update an existing subscriber with validation.
   * @param {string|number} id - pk_huawei_subscriber_id
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updateSubscriber(id, data) {
    const pkId = validatePkId(id);

    // Verify subscriber exists first
    const existing = await subRepository.findById(pkId);
    if (!existing) {
      throw new ServiceError(`Subscriber with ID ${pkId} not found`, 404);
    }

    const { id: subId, name, plan, activation_date } = data;

    // Check if at least one field is provided
    if (
      subId === undefined &&
      name === undefined &&
      plan === undefined &&
      activation_date === undefined
    ) {
      throw new ServiceError('At least one field (id, name, plan, activation_date) must be provided for update', 400);
    }

    // Field-level validation
    if (subId !== undefined) {
      if (typeof subId !== 'string' || subId.trim() === '') {
        throw new ServiceError("Field 'id' must be a non-empty string", 400);
      }
      if (subId.trim().length > 50) {
        throw new ServiceError("Field 'id' must not exceed 50 characters", 400);
      }
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        throw new ServiceError("Field 'name' must be a non-empty string", 400);
      }
      if (name.trim().length > 50) {
        throw new ServiceError("Field 'name' must not exceed 50 characters", 400);
      }
    }

    if (plan !== undefined) {
      if (typeof plan !== 'string' || plan.trim() === '') {
        throw new ServiceError("Field 'plan' must be a non-empty string", 400);
      }
      if (plan.trim().length > 50) {
        throw new ServiceError("Field 'plan' must not exceed 50 characters", 400);
      }
    }

    if (activation_date !== undefined && activation_date !== null && activation_date !== '') {
      if (!isValidDateFormat(activation_date)) {
        throw new ServiceError("Field 'activation_date' must be in YYYY-MM-DD format", 400);
      }
    }

    const updated = await subRepository.update(pkId, {
      id: subId !== undefined ? subId.trim() : undefined,
      name: name !== undefined ? name.trim() : undefined,
      plan: plan !== undefined ? plan.trim() : undefined,
      activation_date: activation_date !== undefined ? (activation_date || null) : undefined,
    });

    return updated;
  },

  /**
   * Delete subscriber by primary key.
   * @param {string|number} id - pk_huawei_subscriber_id
   * @returns {Promise<Object>} The deleted subscriber record.
   */
  async deleteSubscriber(id) {
    const pkId = validatePkId(id);

    // Check existence
    const existing = await subRepository.findById(pkId);
    if (!existing) {
      throw new ServiceError(`Subscriber with ID ${pkId} not found`, 404);
    }

    const deleted = await subRepository.deleteById(pkId);
    return deleted;
  },
};

module.exports = {
  subServices,
  ServiceError,
};
