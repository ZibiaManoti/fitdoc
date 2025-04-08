"use client";
import React from "react";

function MainComponent() {
  const { useState } = React;
  const [timeRange, setTimeRange] = useState("weekly");
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const mockData = {
    weekly: {
      weightProgress: [80, 79.5, 79.2, 78.8, 78.5, 78.2, 78],
      caloriesBurned: [350, 400, 280, 450, 320, 380, 420],
      workoutMinutes: [45, 60, 30, 65, 45, 50, 55],
    },
    achievements: [
      {
        id: 1,
        title: "5K Steps Milestone",
        date: "2025-01-15",
        description: "Completed 5,000 steps daily for 7 consecutive days",
      },
      {
        id: 2,
        title: "Weight Goal Progress",
        date: "2025-01-18",
        description: "Lost 2kg - 25% of your goal weight achieved",
      },
    ],
    recommendations: [
      "Increase water intake to meet daily hydration goals",
      "Consider adding strength training to your routine",
      "Try to get 7-8 hours of sleep for better recovery",
    ],
  };

  const renderProgressCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 font-roboto text-gray-800">
          Weight Progress
        </h3>
        <div className="h-[200px] flex items-end space-x-2">
          {mockData.weekly.weightProgress.map((weight, index) => (
            <div
              key={index}
              className="bg-blue-500 hover:bg-blue-600 transition-all w-full"
              style={{ height: `${(weight / 100) * 100}%` }}
            >
              <div className="text-xs text-white text-center">{weight}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 font-roboto text-gray-800">
          Calories Burned
        </h3>
        <div className="h-[200px] flex items-end space-x-2">
          {mockData.weekly.caloriesBurned.map((calories, index) => (
            <div
              key={index}
              className="bg-green-500 hover:bg-green-600 transition-all w-full"
              style={{ height: `${(calories / 500) * 100}%` }}
            >
              <div className="text-xs text-white text-center">{calories}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHealthTrends = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4 font-roboto text-gray-800">
        Health Trends
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            ↗️ Improving
          </div>
          <div className="text-gray-600">Cardiovascular Endurance</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            ✅ On Track
          </div>
          <div className="text-gray-600">Weight Loss Progress</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-lg font-semibold text-yellow-600">
            ⚠️ Needs Focus
          </div>
          <div className="text-gray-600">Strength Training</div>
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4 font-roboto text-gray-800">
        Personalized Recommendations
      </h3>
      <div className="space-y-4">
        {mockData.recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <i className="fas fa-lightbulb text-yellow-500"></i>
            <span className="text-gray-700 font-roboto">{recommendation}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4 font-roboto text-gray-800">
        Achievement Highlights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockData.achievements.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => {
              setSelectedAchievement(achievement);
              setShowAchievementModal(true);
            }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="font-semibold text-gray-800">
                  {achievement.title}
                </div>
                <div className="text-sm text-gray-500">{achievement.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <h2 className="text-3xl font-bold text-gray-900 font-roboto">
            Insights
          </h2>
          <div className="flex space-x-4">
            {["weekly", "monthly", "yearly"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-roboto ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {renderProgressCharts()}
        {renderHealthTrends()}
        {renderRecommendations()}
        {renderAchievements()}

        {showAchievementModal && selectedAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 font-roboto">
                  {selectedAchievement.title}
                </h2>
                <button
                  onClick={() => setShowAchievementModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-gray-600 mb-2">
                {selectedAchievement.description}
              </p>
              <p className="text-sm text-gray-500">
                Achieved on {selectedAchievement.date}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;