"use client";
import React, { useState, useEffect } from "react";
import BottomBar from "../../components/bottom-bar";
import { useAuth } from "../../../context/AuthContext";
import { db, auth } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function MainComponent() {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser;
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customExercise, setCustomExercise] = useState({
    name: "",
    category_id: 1,
    sets: "",
    reps: "",
    weight_kg: "",
    duration: null,
    time: null,
    length: null,
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  const categories = [
    { id: "all", name: "All Exercises", icon: "dumbbell" },
    { id: "1", name: "Strength", icon: "weight-hanging" },
    { id: "2", name: "Cardio", icon: "running" },
    { id: "3", name: "Flexibility", icon: "child" },
    { id: "4", name: "Balance", icon: "balance-scale" },
    { id: "custom", name: "Custom Exercises", icon: "plus-circle" },
  ];

  const fetchExercises = async () => {
    try {
      setLoading(true);
      console.log("📂 Fetching exercises...");

      if (!auth.currentUser) {
        console.warn("⚠️ No authenticated user found.");
        return;
      }

      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(exercisesQuery);

      if (snapshot.empty) {
        console.log("ℹ️ No exercises found for this user.");
        setExercises([]); // Ensure state is set to an empty array
        return;
      }

      const fetchedExercises = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("✅ Exercises fetched successfully:", fetchedExercises);

      setExercises(fetchedExercises); // ✅ Update state
    } catch (error) {
      setError("Failed to fetch exercises");
      console.error("❌ Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

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

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleAddCustomExercise = async () => {
    try {
      if (!user || !user.uid) {
        throw new Error("Please log in to add exercises");
      }

      if (!customExercise.name || !customExercise.name.trim()) {
        throw new Error("Exercise name is required");
      }

      console.log("Raw form data:", customExercise);

      let exerciseData = {
        name: customExercise.name.trim(),
        category_id: Number(customExercise.category_id) || 1,
        is_ai_recommended: true,
        created_at: new Date().toISOString(),
        duration:
          customExercise.category_id === 2 ? customExercise.duration : null,
        length: customExercise.category_id === 4 ? customExercise.length : null,
        time: customExercise.time ? Number(customExercise.time) : null,
        sets: customExercise.sets ? Number(customExercise.sets) : null,
        reps: customExercise.reps ? Number(customExercise.reps) : null,
        weight_kg: customExercise.weight_kg
          ? parseFloat(customExercise.weight_kg)
          : null,
      };

      // Category-specific data
      if (customExercise.category_id === 2) {
        // Cardio: Ensure duration is set for cardio
        if (!customExercise.duration) {
          throw new Error("Duration is required for cardio exercises");
        }
        exerciseData.duration = customExercise.duration;
      } else if (customExercise.category_id === 3) {
        // Flexibility: Ensure time is set for flexibility
        if (!customExercise.time) {
          throw new Error("Time is required for flexibility exercises");
        }
        exerciseData.time = customExercise.time;
      } else if (customExercise.category_id === 4) {
        // Balance: Ensure duration is set for balance exercises
        if (!customExercise.length) {
          throw new Error("Length is required for balance exercises");
        }
        exerciseData.length = customExercise.length;
      } else {
        // For other categories like traditional strength training
        exerciseData.sets = customExercise.sets
          ? Number(customExercise.sets)
          : null;
        exerciseData.reps = customExercise.reps
          ? Number(customExercise.reps)
          : null;
        exerciseData.weight_kg = customExercise.weight_kg
          ? parseFloat(customExercise.weight_kg)
          : null;
      }

      console.log("Request data:", {
        userId: user.uid,
        action: "create",
        exercise: exerciseData,
      });

      const token = await authUser.getIdToken(); // Get Firebase auth token

      const response = await fetch("/api/manage-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          action: "create",
          exercise: exerciseData,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok || data.error) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      await fetchExercises();
      setCustomExercise({
        name: "",
        category_id: 1,
        sets: "",
        reps: "",
        weight_kg: "",
        duration: null,
        time: null,
        length: null,
      });
      setShowAddModal(false);
      setError(null);
    } catch (error) {
      console.error("Error adding exercise:", error);
      setError(error.message || "Failed to add exercise");
    }
  };

  const handleEditExercise = async () => {
    try {
      // Check if editingExercise exists and if name is provided
      if (!editingExercise?.name || editingExercise.name.trim() === "") {
        throw new Error("Exercise name is required");
      }

      // Base exercise data
      let exerciseData = {
        name: editingExercise.name.trim(),
        category_id: parseInt(editingExercise.category_id),
        is_ai_recommended: editingExercise.is_ai_recommended || false,
      };

      // Category-specific data
      if (editingExercise.category_id === 2) {
        // Cardio
        exerciseData.duration = editingExercise.duration
          ? Number(editingExercise.duration)
          : null;
      } else if (editingExercise.category_id === 3) {
        // Flexibility
        exerciseData.time = editingExercise.time
          ? Number(editingExercise.time)
          : null;
      } else if (editingExercise.category_id === 4) {
        // Balance
        exerciseData.duration = editingExercise.duration
          ? Number(editingExercise.duration)
          : null;
      } else {
        // Other categories: traditional strength training
        exerciseData.sets = editingExercise.sets
          ? Number(editingExercise.sets)
          : null;
        exerciseData.reps = editingExercise.reps
          ? Number(editingExercise.reps)
          : null;
        exerciseData.weight_kg = editingExercise.weight_kg
          ? parseFloat(editingExercise.weight_kg)
          : null;
      }

      // Validate numeric fields
      if (exerciseData.duration && isNaN(exerciseData.duration)) {
        throw new Error("Invalid duration value");
      }
      if (exerciseData.time && isNaN(exerciseData.time)) {
        throw new Error("Invalid time value");
      }
      if (exerciseData.sets && isNaN(exerciseData.sets)) {
        throw new Error("Invalid number of sets");
      }
      if (exerciseData.reps && isNaN(exerciseData.reps)) {
        throw new Error("Invalid number of reps");
      }
      if (exerciseData.weight_kg && isNaN(exerciseData.weight_kg)) {
        throw new Error("Invalid weight value");
      }

      const token = await authUser.getIdToken(); // Get Firebase auth token

      const response = await fetch("/api/manage-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          action: "update",
          exerciseId: editingExercise.id,
          exercise: exerciseData,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(
          data.error || `Failed to update exercise: ${response.status}`
        );
      }

      await fetchExercises(); // Reload exercises after the update
      setEditingExercise(null); // Clear editing form
      setShowEditModal(false); // Close the modal
      setError(null); // Reset any errors
    } catch (error) {
      console.error("Error updating exercise:", error);
      setError("Failed to update exercise: " + error.message);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm("Are you sure you want to delete this exercise?")) {
      return;
    }

    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/manage-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          exerciseId: exerciseId,
          action: "delete",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete exercise");
      }

      await fetchExercises();
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setError("Failed to delete exercise");
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "custom") return exercise.is_ai_recommended;
    return exercise.category_id === parseInt(selectedCategory);
  });

  console.log("🚀 Filtered Exercises:", filteredExercises);

  const renderExerciseCard = (exercise) => {
    const category =
      categories.find((cat) => cat.id === String(exercise.category_id)) || {};

    return (
      <div
        key={exercise.id}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 font-roboto">
              {exercise.name}
            </h3>
            <p className="text-gray-600 text-sm font-roboto">
              {category?.name || "Custom"}
            </p>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
            <i
              className={`fas fa-${category?.icon || "dumbbell"} text-blue-600`}
            ></i>
          </div>
        </div>

        {/* Category-specific fields */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {category?.id === "2" && ( // Cardio
            <div className="text-center">
              <p className="text-gray-600 text-sm font-roboto">Duration</p>
              <p className="text-lg font-semibold text-gray-900 font-roboto">
                {exercise.duration} min
              </p>
            </div>
          )}
          {category?.id === "3" && ( // Flexibility
            <div className="text-center">
              <p className="text-gray-600 text-sm font-roboto">Time</p>
              <p className="text-lg font-semibold text-gray-900 font-roboto">
                {exercise.time} min
              </p>
            </div>
          )}
          {category?.id === "4" && ( // Balance
            <div className="text-center">
              <p className="text-gray-600 text-sm font-roboto">Duration</p>
              <p className="text-lg font-semibold text-gray-900 font-roboto">
                {exercise.duration} min
              </p>
            </div>
          )}
          {/* Other fields for strength exercises */}
          {category?.id !== "2" &&
            category?.id !== "3" &&
            category?.id !== "4" && (
              <>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-roboto">Sets</p>
                  <p className="text-lg font-semibold text-gray-900 font-roboto">
                    {exercise.sets}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-roboto">Reps</p>
                  <p className="text-lg font-semibold text-gray-900 font-roboto">
                    {exercise.reps}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-roboto">Weight</p>
                  <p className="text-lg font-semibold text-gray-900 font-roboto">
                    {exercise.weight_kg} kg
                  </p>
                </div>
              </>
            )}
        </div>

        {/* Edit and Delete buttons */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handleEditExercise(exercise.id)}
            className="text-blue-500 hover:text-blue-700"
            aria-label="Edit Exercise"
          >
            <i className="fas fa-edit"></i>
          </button>

          <button
            onClick={() => handleDeleteExercise(exercise.id)}
            className="text-red-500 hover:text-red-700"
            aria-label="Delete Exercise"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    );
  };

  const renderExerciseModal = (isEdit = false) => {
    const modalExercise = isEdit ? editingExercise : customExercise;
    const setModalExercise = isEdit ? setEditingExercise : setCustomExercise;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 font-roboto">
              {isEdit ? "Edit Exercise" : "Add Custom Exercise"}
            </h2>
            <button
              onClick={() =>
                isEdit ? setShowEditModal(false) : setShowAddModal(false)
              }
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Exercise Name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={modalExercise.name || ""}
              onChange={(e) =>
                setModalExercise({ ...modalExercise, name: e.target.value })
              }
            />

            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={modalExercise.category_id || "1"}
              onChange={(e) =>
                setModalExercise({
                  ...modalExercise,
                  category_id: parseInt(e.target.value),
                })
              }
            >
              <option value="1">Strength Training</option>
              <option value="2">Cardio</option>
              <option value="3">Flexibility</option>
              <option value="4">Balance</option>
            </select>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                min="0"
                placeholder="Sets"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={modalExercise.sets || ""}
                onChange={(e) =>
                  setModalExercise({
                    ...modalExercise,
                    sets: e.target.value ? parseInt(e.target.value) : "",
                  })
                }
              />
              <input
                type="number"
                min="0"
                placeholder="Reps"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={modalExercise.reps || ""}
                onChange={(e) =>
                  setModalExercise({
                    ...modalExercise,
                    reps: e.target.value ? parseInt(e.target.value) : "",
                  })
                }
              />

              {/* Conditionally render weight input based on category */}
              {modalExercise.category_id === 1 && (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Weight (kg)"
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={modalExercise.weight_kg || ""}
                  onChange={(e) =>
                    setModalExercise({
                      ...modalExercise,
                      weight_kg: e.target.value
                        ? parseFloat(e.target.value)
                        : "",
                    })
                  }
                />
              )}

              {/* Conditionally render specific fields for other categories */}
              {modalExercise.category_id === 2 && (
                <div className="col-span-3">
                  <label className="block text-gray-700">
                    Cardio Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Duration (min)"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={modalExercise.duration || ""}
                    onChange={(e) =>
                      setModalExercise({
                        ...modalExercise,
                        duration: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              )}

              {modalExercise.category_id === 3 && (
                <div className="col-span-3">
                  <label className="block text-gray-700">
                    Flexibility Time (sec)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Time (sec)"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={modalExercise.time || ""}
                    onChange={(e) =>
                      setModalExercise({
                        ...modalExercise,
                        time: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
              )}

              {modalExercise.category_id === 4 && (
                <div className="col-span-3">
                  <label className="block text-gray-700">
                    Balance Length (sec)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Length (sec)"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={modalExercise.length || ""}
                    onChange={(e) =>
                      setModalExercise({
                        ...modalExercise,
                        length: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              )}
            </div>

            <button
              onClick={isEdit ? handleEditExercise : handleAddCustomExercise}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-roboto"
            >
              {isEdit ? "Save Changes" : "Add Exercise"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="sticky top-0 z-10">
        <></>
      </div>

      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 font-roboto">
              Workouts
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-roboto"
            >
              <i className="fas fa-plus mr-2"></i>Add Exercise
            </button>
          </div>

          <div className="flex overflow-x-auto space-x-4 mb-8 pb-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap font-roboto
                  ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <i className={`fas fa-${category.icon}`}></i>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <i className="fas fa-dumbbell text-5xl"></i>
              </div>
              <p className="text-xl text-gray-600 font-roboto">
                No exercises have been added yet
              </p>
              <p className="text-gray-500 mt-2 font-roboto">
                Click the 'Add Exercise' button to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) =>
                renderExerciseCard(exercise)
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && renderExerciseModal(false)}
      {showEditModal && renderExerciseModal(true)}

      <div className="fixed bottom-0 left-0 right-0">
        <BottomBar activePage="workouts" onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

export default MainComponent;
