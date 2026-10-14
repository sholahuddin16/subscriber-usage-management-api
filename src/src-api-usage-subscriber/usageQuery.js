/**
 * SQL queries for Huawei Usage Subscriber operations.
 * Aggregation is performed directly in PostgreSQL.
 */
const usageQuery = {
  /**
   * Insert a new usage snapshot record.
   * 
   * $1: fk_huawei_subscriber_id (subscriberId)
   * $2: call_minutes (callMinutes)
   * $3: sms_count (smsCount)
   * $4: data_usage_mb (dataUsageMB)
   * $5: timestamp (timestamptz)
   */
  create: `
    INSERT INTO huawei_usage_subscriber (
      fk_huawei_subscriber_id,
      call_minutes,
      sms_count,
      data_usage_mb,
      timestamp
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING 
      pk_huawei_usage_subscriber_id,
      fk_huawei_subscriber_id,
      call_minutes,
      sms_count,
      data_usage_mb,
      timestamp;
  `,

  /**
   * Retrieve recent usage records with joined subscriber info.
   */
  findRecent: `
    SELECT 
      u.pk_huawei_usage_subscriber_id,
      u.fk_huawei_subscriber_id,
      s.id AS subscriber_code,
      s.name AS subscriber_name,
      s.fk_huawei_subscriber_plan_id AS subscriber_plan,
      p.plan,
      u.call_minutes,
      u.sms_count,
      u.data_usage_mb,
      u.timestamp
    FROM public.huawei_usage_subscriber u
    LEFT JOIN public.huawei_subscriber s 
      ON s.pk_huawei_subscriber_id = u.fk_huawei_subscriber_id
    LEFT JOIN public.huawei_subscriber_plan p 
      ON s.fk_huawei_subscriber_plan_id = p.pk_huawei_subscriber_plan_id
    ORDER BY u.timestamp DESC
    LIMIT 50;
  `,

  /**
   * Get all data Premium users.
   */

  getPremiumDataUsage: `
    SELECT
    ROW_NUMBER() OVER (
        ORDER BY SUM(u.data_usage_mb) DESC
    ) AS rank,
    s.name AS subscriber,
    SUM(u.data_usage_mb) AS total_mb
    FROM public.huawei_usage_subscriber u
    INNER JOIN public.huawei_subscriber s
        ON s.pk_huawei_subscriber_id = u.fk_huawei_subscriber_id
    INNER JOIN public.huawei_subscriber_plan p
        ON p.pk_huawei_subscriber_plan_id = s.fk_huawei_subscriber_plan_id
    WHERE p.plan = 'Premium'
    GROUP BY s.pk_huawei_subscriber_id, s.name
    ORDER BY total_mb DESC
    LIMIT 3;
    `,

  /**
   * Calculate data usage premium.
   */

  calculateDataUsagePremium: `
    SELECT
    COALESCE(SUM(u.data_usage_mb), 0) AS total_data_usage_mb
    FROM huawei_usage_subscriber u
    INNER JOIN huawei_subscriber s
        ON s.pk_huawei_subscriber_id = u.fk_huawei_subscriber_id
    INNER JOIN huawei_subscriber_plan p
        ON p.pk_huawei_subscriber_plan_id = s.fk_huawei_subscriber_plan_id
    WHERE p.plan = 'Premium';
    `,

  /**
   * average call minutes per snapshot is less than or equal to 30.
   */

  calculateCallMinutesLowUsage: `
    SELECT
    s.pk_huawei_subscriber_id,
    s.id AS subscriber_id,
    s.name AS subscriber,
    avg_usage.average_call_minutes,
    avg_usage.total_snapshots
    FROM huawei_subscriber s
    INNER JOIN (
        SELECT
            fk_huawei_subscriber_id,
            ROUND(AVG(call_minutes)) AS average_call_minutes,
            COUNT(*) AS total_snapshots
        FROM huawei_usage_subscriber
        GROUP BY fk_huawei_subscriber_id
        HAVING AVG(call_minutes) <= 30
    ) AS avg_usage
        ON avg_usage.fk_huawei_subscriber_id = s.pk_huawei_subscriber_id
    ORDER BY avg_usage.average_call_minutes ASC;
    `

};

module.exports = usageQuery;
