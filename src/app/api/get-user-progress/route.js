async function handler({ userId, timeframe = "daily" }) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  const timeframes = {
    daily: "INTERVAL '7 days'",
    monthly: "INTERVAL '30 days'",
    yearly: "INTERVAL '365 days'",
  };

  const interval = timeframes[timeframe];
  if (!interval) {
    return { error: "Invalid timeframe. Must be daily, monthly, or yearly" };
  }

  try {
    const progressData = await sql`
      SELECT 
        date,
        weight,
        body_fat_percentage,
        muscle_mass,
        mood,
        energy_level,
        progress_notes
      FROM user_progress
      WHERE user_id = ${userId}
        AND date >= CURRENT_DATE - ${interval}
      ORDER BY date DESC
    `;

    // Always return an array, even if empty
    return {
      [timeframe]: progressData || [],
    };
  } catch (error) {
    console.error("Error fetching progress data:", error);
    // Return empty array instead of error to prevent UI breaking
    return {
      [timeframe]: [],
    };
  }
}