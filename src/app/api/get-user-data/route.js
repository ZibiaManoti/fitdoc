async function handler({ userId }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const [userData, metrics, activities, progress] = await sql.transaction([
      sql`
        SELECT 
          name, weight, height, goal_weight, fitness_level,
          health_conditions, fitness_goals, activity_level,
          profile_picture, birth_date
        FROM user_data 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC 
        LIMIT 1
      `,
      sql`
        SELECT 
          heart_rate, calories_burned, steps_today,
          water_intake, exercise_minutes
        FROM user_metrics 
        WHERE user_id = ${userId}
        ORDER BY recorded_at DESC 
        LIMIT 1
      `,
      sql`
        SELECT 
          activity_type, activity_description,
          duration, recorded_at
        FROM user_activities 
        WHERE user_id = ${userId}
        ORDER BY recorded_at DESC 
        LIMIT 5
      `,
      sql`
        SELECT 
          date, weight, body_fat_percentage,
          muscle_mass, mood, energy_level
        FROM user_progress 
        WHERE user_id = ${userId}
        ORDER BY date DESC 
        LIMIT 7
      `,
    ]);

    return {
      userData: userData[0] || null,
      metrics: metrics[0] || null,
      recentActivities: activities,
      progressData: {
        daily: progress,
        monthly: progress,
        yearly: progress,
      },
    };
  } catch (error) {
    return { error: "Failed to fetch user data" };
  }
}