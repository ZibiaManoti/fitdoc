async function handler({ userId, userData }) {
  console.log(
    "Received onboarding data:",
    JSON.stringify({ userId, userData }, null, 2)
  );

  if (!userId || !userData || !userData.name) {
    console.error("Missing required fields:", { userId, userData });
    return { error: "User ID and name are required" };
  }

  try {
    console.log("Validating data types...");
    // Validate numeric fields
    const numericFields = ["weight", "height", "goal_weight"];
    for (const field of numericFields) {
      if (userData[field] && isNaN(parseFloat(userData[field]))) {
        throw new Error(`Invalid ${field}: must be a number`);
      }
    }

    // Validate arrays
    const arrayFields = ["health_conditions", "fitness_goals"];
    for (const field of arrayFields) {
      if (userData[field] && !Array.isArray(userData[field])) {
        throw new Error(`Invalid ${field}: must be an array`);
      }
    }

    console.log("Starting database transaction...");
    const [userDataResult] = await sql.transaction([
      sql`
        INSERT INTO user_data (
          user_id,
          name,
          weight,
          height,
          goal_weight,
          activity_level,
          health_conditions,
          fitness_goals,
          birth_date
        )
        VALUES (
          ${userId},
          ${userData.name},
          ${userData.weight},
          ${userData.height},
          ${userData.goal_weight},
          ${userData.activity_level},
          ${userData.health_conditions},
          ${userData.fitness_goals},
          ${userData.birth_date}
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
          name = EXCLUDED.name,
          weight = EXCLUDED.weight,
          height = EXCLUDED.height,
          goal_weight = EXCLUDED.goal_weight,
          activity_level = EXCLUDED.activity_level,
          health_conditions = EXCLUDED.health_conditions,
          fitness_goals = EXCLUDED.fitness_goals,
          birth_date = EXCLUDED.birth_date,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
      sql`
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
          0,
          0,
          0,
          0,
          0
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
          heart_rate = 0,
          calories_burned = 0,
          steps_today = 0,
          water_intake = 0,
          exercise_minutes = 0,
          recorded_at = CURRENT_TIMESTAMP
      `,
      sql`
        INSERT INTO user_progress (
          user_id,
          date,
          weight,
          body_fat_percentage,
          muscle_mass,
          mood,
          energy_level
        )
        VALUES (
          ${userId},
          CURRENT_DATE,
          ${userData.weight},
          0,
          0,
          'neutral',
          5
        )
        ON CONFLICT (user_id, date) 
        DO UPDATE SET
          weight = EXCLUDED.weight,
          body_fat_percentage = EXCLUDED.body_fat_percentage,
          muscle_mass = EXCLUDED.muscle_mass,
          mood = EXCLUDED.mood,
          energy_level = EXCLUDED.energy_level
      `,
    ]);

    console.log(
      "Database transaction completed successfully:",
      JSON.stringify(userDataResult[0], null, 2)
    );
    return {
      success: true,
      userData: userDataResult[0],
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      error: "Failed to save onboarding data",
      details: error.message,
    };
  }
}