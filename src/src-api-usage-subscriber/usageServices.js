const usageRepository = require('./usageRepository');
const subRepository = require('../src-api-subscriber/subRepository');

/**
 * Custom error class for Usage Service validation.
 */
class UsageServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UsageServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Validate YYYY-MM-DD date string.
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
 * Validate that timestamp is in Asia/Jakarta (WIB) timezone and exactly at 08:00, 12:00, or 15:00.
 * @param {string} timestampInput 
 * @returns {string} Normalized ISO timestamp string
 */
const validateAndFormatSnapshotTimestamp = (timestampInput) => {
  if (!timestampInput || typeof timestampInput !== 'string') {
    throw new UsageServiceError("Timestamp is required as a datetime string (e.g., '2026-10-12 08:00:00')", 400);
  }

  let str = timestampInput.trim();

  // If no timezone offset is explicitly provided, assume Asia/Jakarta (WIB, UTC+7)
  if (!/[Zz]|([+-]\d{2}:?\d{2})$/.test(str)) {
    str = str.replace(' ', 'T');
    if (str.length === 16) {
      str = `${str}:00`;
    }
    str = `${str}+07:00`;
  }

  const parsedDate = new Date(str);
  if (isNaN(parsedDate.getTime())) {
    throw new UsageServiceError("Invalid datetime format for timestamp", 400);
  }

  // Format in Asia/Jakarta (WIB) to check hour and minute
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(parsedDate);
  const hour = parts.find((p) => p.type === 'hour')?.value;
  const minute = parts.find((p) => p.type === 'minute')?.value;
  const second = parts.find((p) => p.type === 'second')?.value;

  const timeSlot = `${hour}:${minute}`;
  const ALLOWED_SLOTS = ['08:00', '12:00', '15:00'];

  if (!ALLOWED_SLOTS.includes(timeSlot) || second !== '00') {
    throw new UsageServiceError(
      `Invalid snapshot time (${timeSlot}:${second} WIB). Timestamps can only be recorded at snapshot hours: 08:00, 12:00, or 15:00 WIB (Asia/Jakarta).`,
      400
    );
  }

  return parsedDate.toISOString();
};

const usageServices = {
  /**
   * Create a new usage snapshot record.
   * Input columns: subscriberId, callMinutes, smsCount, dataUsageMB, timestamp
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createUsageSubscriber(data) {
    const rawSubId = data.subscriberId ?? data.fk_huawei_subscriber_id;
    const rawCallMinutes = data.callMinutes ?? data.call_minutes ?? 0;
    const rawSmsCount = data.smsCount ?? data.sms_count ?? 0;
    const rawDataUsageMB = data.dataUsageMB ?? data.data_usage_mb;
    const rawTimestamp = data.timestamp;

    // Validate subscriberId
    const subscriberId = Number(rawSubId);
    if (!Number.isInteger(subscriberId) || subscriberId <= 0) {
      throw new UsageServiceError("Field 'subscriberId' must be a valid positive integer primary key", 400);
    }

    // Verify subscriber exists in database
    const subscriber = await subRepository.findById(subscriberId);
    if (!subscriber) {
      throw new UsageServiceError(`Subscriber with primary key ID ${subscriberId} does not exist`, 404);
    }

    // Validate callMinutes
    const callMinutes = Number(rawCallMinutes);
    if (!Number.isInteger(callMinutes) || callMinutes < 0) {
      throw new UsageServiceError("Field 'callMinutes' must be a non-negative integer", 400);
    }

    // Validate smsCount
    const smsCount = Number(rawSmsCount);
    if (!Number.isInteger(smsCount) || smsCount < 0) {
      throw new UsageServiceError("Field 'smsCount' must be a non-negative integer", 400);
    }

    // Validate dataUsageMB
    if (rawDataUsageMB === undefined || rawDataUsageMB === null || rawDataUsageMB === '') {
      throw new UsageServiceError("Field 'dataUsageMB' is required", 400);
    }
    const dataUsageMB = Number(rawDataUsageMB);
    if (!Number.isInteger(dataUsageMB) || dataUsageMB < 0) {
      throw new UsageServiceError("Field 'dataUsageMB' must be a non-negative integer", 400);
    }

    // Validate and format timestamp (08:00, 12:00, or 15:00 WIB)
    const formattedTimestamp = validateAndFormatSnapshotTimestamp(rawTimestamp);

    const createdRecord = await usageRepository.create({
      subscriberId,
      callMinutes,
      smsCount,
      dataUsageMB,
      timestamp: formattedTimestamp,
    });

    return {
      ...createdRecord,
      subscriber_name: subscriber.name,
      subscriber_plan: subscriber.plan,
    };
  },

  /**
   * Get recent usage records.
   * @returns {Promise<Array>}
   */
  async getRecentUsage() {
    return await usageRepository.findRecent();
  },

  /**
   * Get top 3 premium data usage records.
   * @returns {Promise<Array>}
   */
  async getPremiumDataUsage() {
    return await usageRepository.getPremiumDataUsage();
  },

  /**
   * Calculate data usage premium.
   * @returns {Promise<Object>}
   */
  async calculateDataUsagePremium() {
    return await usageRepository.calculateDataUsagePremium();
  },

  /**
   * Calculate call minutes low usage.
   * @returns {Promise<Array>}
   */
  async calculateCallMinutesLowUsage() {
    return await usageRepository.calculateCallMinutesLowUsage();
  }

};

module.exports = {
  usageServices,
  UsageServiceError,
};
