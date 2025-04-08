async function handler() {
  try {
    const result = await sql`
      DELETE FROM user_metrics 
      WHERE recorded_at < NOW() - INTERVAL '24 hours'
    `;

    return {
      success: true,
      message: "Successfully logged out",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to logout",
    };
  }
}