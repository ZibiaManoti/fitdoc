"use client";
import React from "react";
import { getAuth } from "firebase/auth";

function MainComponent() {
  const [mealPlan, setMealPlan] = React.useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedDay, setSelectedDay] = React.useState("today");
  const [nutritionStats, setNutritionStats] = React.useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [nutritionTips, setNutritionTips] = React.useState([]);
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) {
          console.error("No user is logged in.");
          setError("Please log in.");
          return;
        }

        console.log("Fetching user data...");

        const idToken = await user.getIdToken();

        const response = await fetch("/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Please log in.");
          }
          if (response.status === 404) {
            window.location.href = "/onboarding";
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        console.log("User data before generating nutrition plan:", userData);

        setUserData(userData);
        generateNutritionPlan(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          "Unable to load your profile data. Please try refreshing the page."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const generateNutritionPlan = async (userProfile) => {
    try {
      if (!userProfile) {
        console.error("User profile is missing");
        throw new Error("User profile data is missing");
      }

      console.log(
        "Full user profile received:",
        JSON.stringify(userProfile, null, 2)
      );

      console.log("Activity level:", userProfile.activityLevel);
      console.log("Fitness goals:", userProfile.fitnessGoals);

      const safeProfile = {
        ...userProfile,
        weight: userProfile.weight || 70,
        height: userProfile.height || 170,
        goalWeight: userProfile.goalWeight || userProfile.weight || 70,
        activityLevel: userProfile.activityLevel,
        fitnessGoals: Array.isArray(userProfile.fitnessGoals)
          ? userProfile.fitnessGoals
          : [],
        health_conditions: Array.isArray(userProfile.healthConditions)
          ? userProfile.healthConditions
          : [],
      };

      console.log(
        "Safe profile after defaults:",
        JSON.stringify(safeProfile, null, 2)
      );

      const missingData = [];
      if (!userProfile.activityLevel) {
        console.log(
          "Activity level is missing or invalid:",
          userProfile.activityLevel
        );
        missingData.push("Activity Level");
      }
      if (
        !Array.isArray(userProfile.fitnessGoals) ||
        userProfile.fitnessGoals.length === 0
      ) {
        console.log(
          "Fitness goals are missing or invalid:",
          userProfile.fitnessGoals
        );
        missingData.push("Fitness Goals");
      }

      if (missingData.length > 0) {
        console.log("Missing data detected:", missingData);
        throw new Error(
          `Please complete your profile to get a personalized nutrition plan. Missing information: ${missingData.join(
            ", "
          )}. You can update these in your profile settings.`
        );
      }

      const activityLevelMap = {
        sedentary: "Sedentary (little or no exercise)",
        light: "Lightly active (1-3 days/week)",
        moderate: "Moderately active (3-5 days/week)",
        very: "Very active (6-7 days/week)",
        extra: "Extra active (physical job or training)",
      };

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a certified nutritionist and meal planning expert. Generate personalized meal plans and nutrition advice based on user data.",
            },
            {
              role: "user",
              content: `Generate a personalized meal plan and nutrition tips for a user with the following profile:
                - Weight: ${safeProfile.weight} kg
                - Height: ${safeProfile.height} cm
                - Goal Weight: ${safeProfile.goalWeight} kg
                - Activity Level: ${
                  activityLevelMap[safeProfile.activityLevel] ||
                  safeProfile.activityLevel
                }
                - Fitness Goals: ${
                  safeProfile.fitnessGoals.length > 0
                    ? safeProfile.fitnessGoals.join(", ")
                    : "General fitness"
                }
                - Health Conditions: ${
                  safeProfile.healthConditions.length > 0
                    ? safeProfile.healthConditions.join(", ")
                    : "None"
                }
                
                Please provide:
                1. Daily caloric and macro needs (based on their metrics and goals)
                2. A balanced meal plan for the day that matches their caloric needs
                3. Specific nutrition tips based on their goals and health conditions`,
            },
          ],
          json_schema: {
            name: "nutrition_plan",
            schema: {
              type: "object",
              properties: {
                daily_needs: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fats: { type: "number" },
                  },
                  required: ["calories", "protein", "carbs", "fats"],
                  additionalProperties: false,
                },
                meal_plan: {
                  type: "object",
                  properties: {
                    breakfast: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "number" },
                        description: { type: "string" },
                        ingredients: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: [
                        "name",
                        "calories",
                        "description",
                        "ingredients",
                      ],
                      additionalProperties: false,
                    },
                    lunch: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "number" },
                        description: { type: "string" },
                        ingredients: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: [
                        "name",
                        "calories",
                        "description",
                        "ingredients",
                      ],
                      additionalProperties: false,
                    },
                    dinner: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        calories: { type: "number" },
                        description: { type: "string" },
                        ingredients: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: [
                        "name",
                        "calories",
                        "description",
                        "ingredients",
                      ],
                      additionalProperties: false,
                    },
                    snacks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          calories: { type: "number" },
                          description: { type: "string" },
                          ingredients: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: [
                          "name",
                          "calories",
                          "description",
                          "ingredients",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["breakfast", "lunch", "dinner", "snacks"],
                  additionalProperties: false,
                },
                nutrition_tips: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["daily_needs", "meal_plan", "nutrition_tips"],
              additionalProperties: false,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `Failed to generate nutrition plan: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response from nutrition AI");
      }

      const nutritionPlan = JSON.parse(data.choices[0].message.content);

      if (
        !nutritionPlan.daily_needs ||
        !nutritionPlan.meal_plan ||
        !nutritionPlan.nutrition_tips
      ) {
        console.error("Invalid nutrition plan structure:", nutritionPlan);
        throw new Error("Generated nutrition plan is incomplete");
      }

      setNutritionStats(nutritionPlan.daily_needs);
      setMealPlan(nutritionPlan.meal_plan);
      setNutritionTips(nutritionPlan.nutrition_tips);

      try {
        await fetch("/api/generate-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "123",
            type: "nutrition",
            recommendation_type: "nutrition",
            recommendation_text: JSON.stringify(nutritionPlan),
            context: userProfile,
          }),
        });
      } catch (saveError) {
        console.error("Failed to save recommendations:", saveError);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error in generateNutritionPlan:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    if (userData) {
      generateNutritionPlan(userData);
    }
  };

  const handleNavigate = (pageId) => {
    const pages = {
      dashboard: "/dashboard",
      workouts: "/workouts",
      nutrition: "/nutrition",
      profile: "/profile",
    };

    if (pages[pageId]) {
      window.location.href = pages[pageId];
    }
  };

  const handleProfile = () => {
    window.location.href = "/profile";
  };

  const renderMacroBreakdown = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 font-roboto">
        Daily Nutritional Needs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Calories</p>
          <p className="text-2xl font-bold text-blue-600">
            {nutritionStats.calories}
          </p>
          <p className="text-xs text-gray-500">kcal/day</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Protein</p>
          <p className="text-2xl font-bold text-green-600">
            {nutritionStats.protein}g
          </p>
          <p className="text-xs text-gray-500">Build & repair muscle</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Carbs</p>
          <p className="text-2xl font-bold text-yellow-600">
            {nutritionStats.carbs}g
          </p>
          <p className="text-xs text-gray-500">Energy source</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Fats</p>
          <p className="text-2xl font-bold text-purple-600">
            {nutritionStats.fats}g
          </p>
          <p className="text-xs text-gray-500">Essential nutrients</p>
        </div>
      </div>
    </div>
  );

  const renderMealCard = (meal, title) => (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="space-y-4">
        <div>
          <p className="font-medium text-blue-600">{meal.name}</p>
          <p className="text-sm text-gray-600">{meal.calories} kcal</p>
        </div>
        <p className="text-sm text-gray-700">{meal.description}</p>
        <div>
          <p className="text-sm font-medium mb-2">Ingredients:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {meal.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderMealPlan = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 font-roboto">
        Today's Meal Plan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderMealCard(mealPlan.breakfast, "Breakfast")}
        {renderMealCard(mealPlan.lunch, "Lunch")}
        {renderMealCard(mealPlan.dinner, "Dinner")}
      </div>

      {mealPlan.snacks && mealPlan.snacks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recommended Snacks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlan.snacks.map((snack, index) => (
              <div key={index} className="bg-white rounded-xl shadow p-6">
                <p className="font-medium text-blue-600">{snack.name}</p>
                <p className="text-sm text-gray-600 mb-2">
                  {snack.calories} kcal
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  {snack.description}
                </p>
                <div>
                  <p className="text-sm font-medium mb-1">Ingredients:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {snack.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderNutritionTips = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 font-roboto">Nutrition Tips</h2>
      <div className="grid gap-4">
        {nutritionTips.map((tip, index) => (
          <div key={index} className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-blue-800 mb-1">{tip.title}</p>
            <p className="text-sm text-gray-700">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const BottomBar = ({ activePage, onNavigate }) => (
    <div className="bg-white shadow-lg border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activePage === "dashboard" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <i className="fas fa-home text-xl mb-1"></i>
          <span className="text-xs">Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate("workouts")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activePage === "workouts" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <i className="fas fa-dumbbell text-xl mb-1"></i>
          <span className="text-xs">Workouts</span>
        </button>
        <button
          onClick={() => onNavigate("nutrition")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activePage === "nutrition" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <i className="fas fa-utensils text-xl mb-1"></i>
          <span className="text-xs">Nutrition</span>
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            activePage === "profile" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <i className="fas fa-user text-xl mb-1"></i>
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">
            Generating your personalized nutrition plan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-3xl text-red-600 mb-4"></i>
          <p className="text-gray-800 mb-4">{error}</p>
          <div className="space-y-4">
            <a
              href="/profile"
              className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Profile
            </a>
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="sticky top-0 z-10">
        <></>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 font-roboto">
              Nutrition Plan
            </h1>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Refresh Plan</span>
            </button>
          </div>

          {renderMacroBreakdown()}
          {mealPlan && renderMealPlan()}
          {nutritionTips.length > 0 && renderNutritionTips()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <BottomBar activePage="nutrition" onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default MainComponent;
