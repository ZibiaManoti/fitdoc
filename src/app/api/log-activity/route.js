async function handler({
  userId,
  activityType,
  activityDescription,
  duration,
  metrics = {},
}) {
  if (!userId || !activityType || !activityDescription) {
    return { error: "Missing required fields" };
  }

  try {
    const queries = [
      sql`
        INSERT INTO user_activities (
          user_id, 
          activity_type, 
          activity_description, 
          duration
        ) 
        VALUES (
          ${userId}, 
          ${activityType}, 
          ${activityDescription}, 
          ${duration}
        ) 
        RETURNING *
      `,
    ];

    if (Object.keys(metrics).length > 0) {
      const {
        heartRate,
        caloriesBurned,
        stepsToday,
        waterIntake,
        exerciseMinutes,
      } = metrics;

      queries.push(sql`
        INSERT INTO user_metrics (
          user_id,
          heart_rate,
          calories_burned,
          steps_today,
          water_intake,
          exercise_minutes
        )
        VALUES (
          ${userId},
          ${heartRate || 0},
          ${caloriesBurned || 0},
          ${stepsToday || 0},
          ${waterIntake || 0},
          ${exerciseMinutes || 0}
        )
        RETURNING *
      `);
    }

    const [activity, metrics] = await sql.transaction(queries);

    return {
      success: true,
      activity: activity[0],
      metrics: metrics?.[0],
    };
  } catch (error) {
    return { error: "Failed to log activity" };
  }
}