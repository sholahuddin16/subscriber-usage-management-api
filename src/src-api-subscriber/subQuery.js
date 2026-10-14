/**
 * SQL queries for Huawei Subscriber management.
 * Table: huawei_subscriber
 */
const subQuery = {
  findAll: `
    SELECT 
      s.pk_huawei_subscriber_id,
      s.id,
      s.name,
      s.fk_huawei_subscriber_plan_id,
      p.plan,
      s.activation_date,
      s.created_date,
      s.lastupdate_date
    FROM public.huawei_subscriber s
    LEFT JOIN public.huawei_subscriber_plan p ON s.fk_huawei_subscriber_plan_id = p.pk_huawei_subscriber_plan_id 
    ORDER BY s.pk_huawei_subscriber_id ASC;
  `,

  planSub: `
  SELECT 
      p.pk_huawei_subscriber_plan_id,
      p.plan 
    FROM public.huawei_subscriber_plan p
    ORDER BY p.pk_huawei_subscriber_plan_id ASC;
  `,

  findById: `
    SELECT 
      s.pk_huawei_subscriber_id,
      s.id,
      s.name,
      plan,
      s.activation_date,
      s.created_date,
      s.lastupdate_date
    FROM public.huawei_subscriber s
    LEFT JOIN public.huawei_subscriber_plan p ON s.fk_huawei_subscriber_plan_id = p.pk_huawei_subscriber_plan_id
    WHERE s.pk_huawei_subscriber_id = $1;
  `,

  create: `
    INSERT INTO huawei_subscriber (
      id,
      name,
      fk_huawei_subscriber_plan_id,
      activation_date,
      created_date,
      lastupdate_date
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      COALESCE($5, CURRENT_TIMESTAMP),
      CURRENT_TIMESTAMP
    )
    RETURNING 
      pk_huawei_subscriber_id,
      id,
      name,
      fk_huawei_subscriber_plan_id,
      activation_date,
      created_date,
      lastupdate_date;
  `,

  update: `
    UPDATE huawei_subscriber
    SET 
      id = COALESCE($1, id),
      name = COALESCE($2, name),
      fk_huawei_subscriber_plan_id = COALESCE($3, fk_huawei_subscriber_plan_id),
      activation_date = COALESCE($4, activation_date),
      lastupdate_date = CURRENT_TIMESTAMP
    WHERE pk_huawei_subscriber_id = $5
    RETURNING 
      pk_huawei_subscriber_id,
      id,
      name,
      fk_huawei_subscriber_plan_id,
      activation_date,
      created_date,
      lastupdate_date;
  `,

  deleteById: `
    DELETE FROM huawei_subscriber
    WHERE pk_huawei_subscriber_id = $1
    RETURNING 
      pk_huawei_subscriber_id,
      id,
      name,
      fk_huawei_subscriber_plan_id,
      activation_date,
      created_date,
      lastupdate_date;
  `,
};

module.exports = subQuery;
