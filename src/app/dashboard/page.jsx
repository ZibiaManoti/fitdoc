"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import {
  Line,
  Bar,
  Doughnut,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line as LineChart, Bar as BarChart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      window.location.href = "/account/signin?callbackUrl=/dashboard";
      return;
    }

    const fetchDashboardData = async () => {
      try {
        if (!user || !user.uid) {
          console.warn(
            "⚠️ No authenticated user found, skipping Firestore request."
          );
          return;
        }

        setLoading(true);
        setError(null);
        console.log("📂 Fetching dashboard data for user:", user.uid);

        // 1. Fetch user data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error("⚠️ User data not found");
        }
        const userData = userDoc.data();
        setUserData(userData);

        // 2. Fetch exercises
        const exercisesQuery = query(
          collection(db, "exercises"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(exercisesQuery);
        const fetchedExercises = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert 'created_at' to Date object
          const createdAtDate = new Date(data.created_at); // Convert string to Date
          return {
            id: doc.id,
            ...data,
            createdAtDate, // Add the createdAtDate field
          };
        });
        setExercises(fetchedExercises);

        // 3. Generate progress from exercises (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentProgress = fetchedExercises
          .filter((ex) => ex.createdAtDate >= sevenDaysAgo) // Filter for the last 7 days
          .map((ex) => ({
            id: ex.id,
            date: ex.createdAtDate,
            weight: ex.weight_kg,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            time: ex.time,
            exerciseCategory: ex.category_id,
            notes: ex.notes || "No notes provided",
          }));

        setUserProgress(recentProgress);

        console.log("🧪 userData being sent:", userData);
        console.log("🏋️ exercises being sent:", fetchedExercises);

        // 4. Generate recommendations via API
        const token = await auth.currentUser.getIdToken(); // 🔐 For auth in /api route

        const recResponse = await fetch("/api/generate-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userData,
            exercises: fetchedExercises,
          }),
        });

        if (!recResponse.ok) {
          throw new Error("Failed to generate recommendations");
        }

        const recResult = await recResponse.json();
        setRecommendations(recResult.recommendations || []);
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        setError(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    } else {
      console.warn("⚠️ No user found, skipping data fetch.");
    }
  }, [user]);

  const calculateBMI = () => {
    if (!userData?.weight || !userData?.height) return "N/A";
    const heightInMeters = userData.height / 100;
    const bmi = userData.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const calculateCalorieNeeds = () => {
    if (!userData?.weight || !userData?.height || !userData?.activityLevel)
      return "N/A";

    // Basic Harris-Benedict equation
    const bmr =
      10 * userData.weight + 6.25 * userData.height - 5 * (userData.age || 30);

    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    return Math.round(
      bmr * (activityMultipliers[userData.activityLevel] || 1.2)
    );
  };

  const weightProgressData = {
    labels: userProgress.map((entry) =>
      new Date(entry.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Weight (kg)",
        data: userProgress.map((entry) => entry.weight),
        fill: false,
        borderColor: "#3b82f6", // Tailwind's blue-500
        backgroundColor: "#60a5fa",
        tension: 0.3,
      },
    ],
  };

  const renderUserStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Weight</span>
            <span className="font-medium">{userData?.weight || "N/A"} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Height</span>
            <span className="font-medium">{userData?.height || "N/A"} cm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">BMI</span>
            <span className="font-medium">{calculateBMI()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutrition</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Daily Calories</span>
            <span className="font-medium">{calculateCalorieNeeds()} kcal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Goal Weight</span>
            <span className="font-medium">
              {userData?.goalWeight || "N/A"} kg
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Fitness Level
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Activity Level</span>
            <span className="font-medium capitalize">
              {userData?.activityLevel?.replace("_", " ") || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fitness Goals</span>
            <div className="flex flex-wrap justify-end gap-1">
              {Array.isArray(userData?.fitnessGoals) ? (
                userData.fitnessGoals.map((goal, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    {goal}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No fitness goals set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Progress Tracking
      </h3>

      {userProgress.length > 0 ? (
        <div className="space-y-4">
          {userProgress.map((progress) => (
            <div
              key={progress.id}
              className="border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  {progress.date?.toLocaleDateString()}
                </span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {progress.weight ? `${progress.weight} kg` : "No weight"}
                </span>
              </div>

              {/* Display progress based on exercise category */}
              <div className="text-sm text-gray-600">
                {progress.exerciseCategory === 2 && progress.duration ? (
                  <div>
                    <strong>Cardio Duration:</strong> {progress.duration} min
                  </div>
                ) : progress.exerciseCategory === 3 && progress.time ? (
                  <div>
                    <strong>Flexibility Time:</strong> {progress.time} min
                  </div>
                ) : progress.exerciseCategory === 4 && progress.duration ? (
                  <div>
                    <strong>Balance Duration:</strong> {progress.duration} min
                  </div>
                ) : progress.exerciseCategory === 1 &&
                  progress.sets &&
                  progress.reps ? (
                  <div>
                    <strong>Strength Training:</strong> {progress.sets} sets,{" "}
                    {progress.reps} reps, {progress.weight} kg
                  </div>
                ) : (
                  <p>No category-specific progress data available</p>
                )}
              </div>

              {/* Notes */}
              {progress.notes && (
                <p className="text-sm text-gray-600">{progress.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          No progress entries yet. Start tracking your progress!
        </p>
      )}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Weight Progress (Last 7 Days)
        </h3>
        {userProgress.length > 0 ? (
          <LineChart data={weightProgressData} />
        ) : (
          <p className="text-gray-600">No data to show.</p>
        )}
      </div>
    </div>
  );

  const renderWorkoutRecommendations = () => {
    if (recommendations.length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-gray-600">
            No workout recommendations available yet. Complete some workouts to
            get recommendations!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {recommendations.map((rec) => {
          // Handle the createdAt field
          let formattedDate = null;
          if (rec.createdAt instanceof Timestamp) {
            // If it's a Firestore Timestamp, convert it to Date
            formattedDate = rec.createdAt.toDate().toLocaleDateString();
          } else if (typeof rec.createdAt === "string") {
            // If it's a string, assume it's an ISO date string and convert it
            formattedDate = new Date(rec.createdAt).toLocaleDateString();
          }

          return (
            <div key={rec.id} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {rec.exerciseName}
                  </h3>
                  <p className="text-sm text-gray-600">{rec.category}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {formattedDate}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">{rec.description}</p>

                {rec.tips && rec.tips.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {rec.tips.map((tip, i) => (
                        <li key={i} className="text-gray-600 text-sm">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Main Content */}
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userData?.name || "User"}!
          </h1>
          <p className="text-gray-600">Here's your fitness journey overview</p>
        </div>

        {renderUserStats()}
        {renderProgress()}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Workout Recommendations
        </h2>
        {renderWorkoutRecommendations()}
      </div>
    </div>
  );
}

export default Dashboard;
