async function handler({ userId, userData }) {
  if (!userId || !userData) {
    return { error: "User ID and update data are required" };
  }

  try {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      "name",
      "weight",
      "height",
      "goal_weight",
      "profile_picture",
      "fitness_level",
      "health_conditions",
      "fitness_goals",
      "activity_level",
      "birth_date",
    ];

    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClauses.length === 0) {
      return { error: "No valid fields to update" };
    }

    const setClause = setClauses.join(", ");
    const query = `
      UPDATE user_data 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $${paramCount} 
      RETURNING *
    `;

    values.push(userId);

    const [updatedUser, aiRecommendation] = await sql.transaction([
      sql(query, values),
      sql`
        INSERT INTO ai_recommendations (
          user_id, 
          recommendation_type, 
          recommendation_text, 
          context
        )
        VALUES (
          ${userId},
          'profile_update',
          'Profile update triggered new recommendations',
          ${JSON.stringify(userData)}
        )
        RETURNING *
      `,
    ]);

    return {
      success: true,
      userData: updatedUser[0],
      aiRecommendation: aiRecommendation[0],
    };
  } catch (error) {
    return { error: "Failed to update user data" };
  }
}