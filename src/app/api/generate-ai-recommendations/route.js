async function handler({ userId }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const [userData, metrics, activities, progress] = await sql.transaction([
      sql`
        SELECT 
          name, weight, height, goal_weight, fitness_level, 
          health_conditions, fitness_goals, activity_level, birth_date
        FROM user_data 
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC 
        LIMIT 1
      `,
      sql`
        SELECT heart_rate, calories_burned, steps_today, water_intake, exercise_minutes 
        FROM user_metrics 
        WHERE user_id = ${userId}
        ORDER BY recorded_at DESC 
        LIMIT 1
      `,
      sql`
        SELECT activity_type, activity_description, duration
        FROM user_activities 
        WHERE user_id = ${userId}
        ORDER BY recorded_at DESC 
        LIMIT 5
      `,
      sql`
        SELECT weight, body_fat_percentage, muscle_mass, mood, energy_level
        FROM user_progress
        WHERE user_id = ${userId}
        ORDER BY date DESC
        LIMIT 1
      `,
    ]);

    if (!userData[0]) {
      return { error: "User data not found" };
    }

    const userContext = {
      profile: userData[0],
      recentMetrics: metrics[0] || {},
      recentActivities: activities || [],
      latestProgress: progress[0] || {},
    };

    const prompt = `
      As a fitness expert, provide personalized recommendations for a user with the following profile:
      
      Profile:
      - Name: ${userContext.profile.name}
      - Current Weight: ${userContext.profile.weight}kg
      - Goal Weight: ${userContext.profile.goal_weight}kg
      - Fitness Level: ${userContext.profile.fitness_level}
      - Health Conditions: ${userContext.profile.health_conditions?.join(", ")}
      - Fitness Goals: ${userContext.profile.fitness_goals?.join(", ")}
      - Activity Level: ${userContext.profile.activity_level}
      
      Recent Metrics:
      - Heart Rate: ${userContext.recentMetrics.heart_rate}
      - Daily Steps: ${userContext.recentMetrics.steps_today}
      - Exercise Minutes: ${userContext.recentMetrics.exercise_minutes}
      
      Latest Progress:
      - Body Fat: ${userContext.latestProgress.body_fat_percentage}%
      - Muscle Mass: ${userContext.latestProgress.muscle_mass}kg
      - Energy Level: ${userContext.latestProgress.energy_level}
      
      Provide 3 specific workout recommendations, 3 nutrition tips, and 2 goal-setting suggestions.
      Format the response as a JSON object with keys: workout, nutrition, goals.
      Keep each recommendation under 100 characters.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional fitness coach and nutritionist.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate recommendations");
    }

    const gptResponse = await response.json();
    const recommendations = JSON.parse(gptResponse.choices[0].message.content);

    const timestamp = new Date();
    const [workoutRecs, nutritionRecs, goalRecs] = await sql.transaction(
      [
        sql`
        INSERT INTO ai_recommendations (user_id, recommendation_type, recommendation_text, context, created_at)
        SELECT ${userId}, 'workout', recommendation, ${JSON.stringify(
          userContext
        )}, ${timestamp}
        FROM unnest($1::text[]) AS recommendation
        RETURNING *
      `,
        sql`
        INSERT INTO ai_recommendations (user_id, recommendation_type, recommendation_text, context, created_at)
        SELECT ${userId}, 'nutrition', recommendation, ${JSON.stringify(
          userContext
        )}, ${timestamp}
        FROM unnest($1::text[]) AS recommendation
        RETURNING *
      `,
        sql`
        INSERT INTO ai_recommendations (user_id, recommendation_type, recommendation_text, context, created_at)
        SELECT ${userId}, 'goals', recommendation, ${JSON.stringify(
          userContext
        )}, ${timestamp}
        FROM unnest($1::text[]) AS recommendation
        RETURNING *
      `,
      ],
      [
        recommendations.workout,
        recommendations.nutrition,
        recommendations.goals,
      ]
    );

    return {
      recommendations: {
        workout: workoutRecs,
        nutrition: nutritionRecs,
        goals: goalRecs,
      },
    };
  } catch (error) {
    return { error: "Failed to generate recommendations" };
  }
}