const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const pool = require('../config/db');

// Directory for CSV exports inside src
const EXPORT_DIR = path.join(__dirname, '../csv-exports');
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Ensure destination directory exists.
 */
function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

/**
 * Format CSV field, escaping quotes and commas.
 * @param {any} value 
 * @returns {string}
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Clean up CSV files older than 30 days.
 */
function cleanupOldCsvFiles() {
  ensureExportDir();
  try {
    const files = fs.readdirSync(EXPORT_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (file.toLowerCase().endsWith('.csv')) {
        const filePath = path.join(EXPORT_DIR, file);
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > RETENTION_MS) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`[CRON CLEANUP] Deleted export file older than ${RETENTION_DAYS} days: ${file}`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CRON CLEANUP] Purged ${deletedCount} expired CSV file(s) (>30 days).`);
    }
  } catch (error) {
    console.error('[CRON CLEANUP] Error during CSV cleanup:', error.message);
  }
}

/**
 * Export usage subscriber data to a CSV file.
 * @returns {Promise<Object>} Export metadata
 */
async function exportUsageToCsv() {
  ensureExportDir();

  // Run cleanup first to remove files older than 30 days
  cleanupOldCsvFiles();

  const query = `
    SELECT 
      u.pk_huawei_usage_subscriber_id,
      u.fk_huawei_subscriber_id,
      COALESCE(s.id, '-') AS subscriber_code,
      COALESCE(s.name, '-') AS subscriber_name,
      s.fk_huawei_subscriber_plan_id,
      COALESCE(p.plan, '-') AS subscriber_plan,
      u.call_minutes,
      u.sms_count,
      u.data_usage_mb,
      TO_CHAR(u.timestamp AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') AS timestamp_wib
    FROM public.huawei_usage_subscriber u
    LEFT JOIN public.huawei_subscriber s 
      ON s.pk_huawei_subscriber_id = u.fk_huawei_subscriber_id
    LEFT JOIN public.huawei_subscriber_plan p 
      ON s.fk_huawei_subscriber_plan_id = p.pk_huawei_subscriber_plan_id
    ORDER BY u.timestamp DESC;
  `;

  const { rows } = await pool.query(query);

  // CSV Header
  const headers = [
    'pk_huawei_usage_subscriber_id',
    'fk_huawei_subscriber_id',
    'subscriber_code',
    'subscriber_name',
    'fk_huawei_subscriber_plan_id',
    'subscriber_plan',
    'call_minutes',
    'sms_count',
    'data_usage_mb',
    'timestamp_wib',
  ];

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = [
      escapeCsv(row.pk_huawei_usage_subscriber_id),
      escapeCsv(row.fk_huawei_subscriber_id),
      escapeCsv(row.subscriber_code),
      escapeCsv(row.subscriber_name),
      escapeCsv(row.fk_huawei_subscriber_plan_id),
      escapeCsv(row.subscriber_plan),
      escapeCsv(row.call_minutes),
      escapeCsv(row.sms_count),
      escapeCsv(row.data_usage_mb),
      escapeCsv(row.timestamp_wib),
    ];
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\r\n');

  // Generate filename with WIB timestamp: usage_subscriber_YYYY-MM-DD_HH-mm-ss.csv
  const now = new Date();
  const dateWibParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // YYYY-MM-DD

  const timeWibParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now).replace(/:/g, '-'); // HH-mm-ss

  const filename = `usage_subscriber_${dateWibParts}_${timeWibParts}.csv`;
  const filePath = path.join(EXPORT_DIR, filename);

  fs.writeFileSync(filePath, csvContent, 'utf8');

  console.log(`[CRON EXPORT] CSV created successfully: ${filename} (${rows.length} records) in ${EXPORT_DIR}`);

  return {
    filename,
    filePath,
    rowCount: rows.length,
    fileSizeBytes: Buffer.byteLength(csvContent, 'utf8'),
    timestampWib: `${dateWibParts} ${timeWibParts.replace(/-/g, ':')}`,
  };
}

/**
 * List all generated CSV files with details.
 */
function listExportedCsvFiles() {
  ensureExportDir();
  const files = fs.readdirSync(EXPORT_DIR);
  const result = [];

  for (const file of files) {
    if (file.toLowerCase().endsWith('.csv')) {
      const filePath = path.join(EXPORT_DIR, file);
      const stats = fs.statSync(filePath);
      result.push({
        filename: file,
        sizeBytes: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        ageDays: Math.floor((Date.now() - stats.mtimeMs) / (24 * 60 * 60 * 1000)),
      });
    }
  }

  return result.sort((a, b) => b.modifiedAt - a.modifiedAt);
}

/**
 * Initialize cron job scheduled at 08:00, 12:00, and 15:00 WIB (Asia/Jakarta).
 */
function initUsageCron() {
  ensureExportDir();

  // Run cleanup once on server startup
  cleanupOldCsvFiles();

  // Schedule cron at 08:00, 12:00, and 15:00 WIB
  // Cron syntax: minute hour day-of-month month day-of-week
  // We need separate schedules since the times span different hours
  const cronExpressions = [
    { expr: '00 08 * * *', label: '08:00' },
    { expr: '00 12 * * *', label: '12:00' },
    { expr: '00 15 * * *', label: '15:00' },
  ];

  for (const { expr, label } of cronExpressions) {
    cron.schedule(
      expr,
      async () => {
        console.log(`[CRON] Triggered scheduled usage snapshot CSV export (${label} WIB)...`);
        try {
          await exportUsageToCsv();
        } catch (err) {
          console.error('[CRON ERROR] Failed to export usage data to CSV:', err.message);
        }
      },
      {
        timezone: 'Asia/Jakarta',
      }
    );
  }

  console.log(`[CRON] Usage Subscriber CSV export cron job initialized for 00:31, 00:35, 01:00 WIB (Retention: ${RETENTION_DAYS} days).`);
}

module.exports = {
  initUsageCron,
  exportUsageToCsv,
  cleanupOldCsvFiles,
  listExportedCsvFiles,
  EXPORT_DIR,
};
