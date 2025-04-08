"use client";
import React, { useState, useEffect } from "react";
import { useUpload } from "../../utilities/runtime-helpers";
import { useAuth } from "../../../context/AuthContext";
import { getAuth } from "firebase/auth";
import { format } from "date-fns";

function MainComponent() {
  const { user } = useAuth();
  const auth = getAuth();

  const { logOut } = useAuth();
  const authUser = auth.currentUser;
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    dateJoined: "",
    weight: 0,
    height: 0,
    age: 1,
    fitnessLevel: "",
    fitnessGoals: [],
    healthConditions: ["None"],
    dietaryRestrictions: ["None"],
    activityLevel: "",
    notificationPreferences: {
      workoutReminders: false,
      nutritionAlerts: false,
      progressUpdates: false,
      newsAndTips: false,
    },
  });

  const fitnessGoalOptions = [
    "Weight Loss",
    "Muscle Gain",
    "Improve Endurance",
    "Better Flexibility",
    "Overall Health",
  ];

  const healthConditionOptions = [
    "None",
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Asthma",
    "Joint Pain",
  ];

  const dietaryRestrictionOptions = [
    "None",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Lactose Intolerant",
    "Kosher",
    "Halal",
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(userData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        window.location.href = "/account/signin?callbackUrl=/profile";
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await authUser.getIdToken();
        const response = await fetch("/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        console.log("CreatedAt:", data.userData.createdAt);

        if (data.userData) {
          const userFromDB = data.userData;

          const mappedUser = {
            name: userFromDB.fullName || auth.currentUser.displayName, // fallback to empty string if not set
            email: userFromDB.email || auth.currentUser.email,
            dateJoined: userFromDB.createdAt || "",
            weight: userFromDB.weight || 0,
            height: userFromDB.height || 0,
            age: userFromDB.birthDate
              ? new Date().getFullYear() -
                new Date(userFromDB.birthDate).getFullYear()
              : 1,
            fitnessLevel: userFromDB.activityLevel || "",
            fitnessGoals: userFromDB.fitnessGoals || [],
            healthConditions: userFromDB.healthConditions || ["None"],
            dietaryRestrictions: userFromDB.dietaryRestrictions || ["None"],
            activityLevel: userFromDB.activityLevel || "",
            notificationPreferences: userFromDB.notificationPreferences || {
              workoutReminders: false,
              nutritionAlerts: false,
              progressUpdates: false,
              newsAndTips: false,
            },
          };

          setUserData(mappedUser);
          setEditedUser(mappedUser);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const formattedDate =
    userData.dateJoined &&
    format(new Date(userData.dateJoined), "MMMM d, yyyy");

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userData: editedUser,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setUserData(editedUser);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save changes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut(); // Call the AuthContext logout function
      window.location.href = "/account/signin"; // Redirect after logout
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  const renderPersonalInfo = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold font-roboto">
          Personal Information
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-600 hover:text-blue-700"
        >
          <i className={`fas ${isEditing ? "fa-times" : "fa-edit"}`}></i>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedUser.name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Name"
              />
              <input
                type="email"
                value={editedUser.email}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, email: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Email"
              />
            </>
          ) : (
            <>
              <p className="text-gray-800 font-roboto">{userData.name}</p>
              <p className="text-gray-600 font-roboto">{userData.email}</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center">
          <p className="mt-2 text-gray-600 font-roboto">
            Member since {formattedDate || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderFitnessDetails = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6 font-roboto">
        Fitness Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-4 font-roboto">Physical Stats</h3>
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={editedUser.weight}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, weight: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={editedUser.height}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, height: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-roboto">
                  Weight: {userData.weight} kg
                </p>
                <p className="text-gray-600 font-roboto">
                  Height: {userData.height} cm
                </p>
              </>
            )}
          </div>

          <h3 className="font-medium mb-4 mt-12 font-roboto">
            Health Conditions
          </h3>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {healthConditionOptions.map((condition) => (
                <div
                  key={condition}
                  className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={editedUser.healthConditions.includes(condition)}
                    onChange={() => {
                      const isSelected =
                        editedUser.healthConditions.includes(condition);
                      const updatedConditions = isSelected
                        ? editedUser.healthConditions.filter(
                            (c) => c !== condition
                          )
                        : [...editedUser.healthConditions, condition];

                      setEditedUser({
                        ...editedUser,
                        healthConditions: updatedConditions,
                      });
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label>{condition}</label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 font-roboto">
              {userData.healthConditions?.length
                ? userData.healthConditions.join(", ")
                : "Not specified"}
            </p>
          )}
        </div>
        <div>
          <h3 className="font-medium mb-4 font-roboto">Fitness Level</h3>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {fitnessGoalOptions.map((goal) => (
                <div
                  key={goal}
                  className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={editedUser.fitnessGoals.includes(goal)}
                    onChange={() => {
                      const isSelected = editedUser.fitnessGoals.includes(goal);
                      const updatedGoals = isSelected
                        ? editedUser.fitnessGoals.filter((g) => g !== goal)
                        : [...editedUser.fitnessGoals, goal];

                      setEditedUser({
                        ...editedUser,
                        fitnessGoals: updatedGoals,
                      });
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label>{goal}</label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 font-roboto">
              {userData.fitnessGoals?.length
                ? userData.fitnessGoals.join(", ")
                : "Not specified"}
            </p>
          )}

          <h3 className="font-medium mb-4 mt-6 font-roboto">Activity Level</h3>
          {isEditing ? (
            <select
              value={editedUser.activityLevel}
              onChange={(e) =>
                setEditedUser({ ...editedUser, activityLevel: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="sedentary">
                Sedentary (little or no exercise)
              </option>
              <option value="light">Lightly active (1-3 days/week)</option>
              <option value="moderate">
                Moderately active (3-5 days/week)
              </option>
              <option value="very">Very active (6-7 days/week)</option>
              <option value="extra">
                Extra active (physical job or training)
              </option>
            </select>
          ) : (
            <p className="text-gray-600 font-roboto">
              {userData.activityLevel}
            </p>
          )}

          <h3 className="font-medium mb-4 mt-6 font-roboto">
            Dietary Restrictions
          </h3>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dietaryRestrictionOptions.map((restriction) => (
                <div
                  key={restriction}
                  className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={editedUser.dietaryRestrictions.includes(
                      restriction
                    )}
                    onChange={() => {
                      const isSelected =
                        editedUser.dietaryRestrictions.includes(restriction);
                      const updatedRestrictions = isSelected
                        ? editedUser.dietaryRestrictions.filter(
                            (r) => r !== restriction
                          )
                        : [...editedUser.dietaryRestrictions, restriction];

                      setEditedUser({
                        ...editedUser,
                        dietaryRestrictions: updatedRestrictions,
                      });
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label>{restriction}</label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 font-roboto">
              {userData.dietaryRestrictions?.length
                ? userData.dietaryRestrictions.join(", ")
                : "Not specified"}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationPreferences = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6 font-roboto">
        Notification Preferences
      </h2>
      <div className="space-y-4">
        {Object.entries(userData.notificationPreferences).map(
          ([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="font-roboto">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    isEditing ? editedUser.notificationPreferences[key] : value
                  }
                  onChange={(e) =>
                    isEditing &&
                    setEditedUser({
                      ...editedUser,
                      notificationPreferences: {
                        ...editedUser.notificationPreferences,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {renderPersonalInfo()}
        {renderFitnessDetails()}
        {renderNotificationPreferences()}

        {isEditing && (
          <div className="flex justify-end space-x-4 mb-6">
            <button
              onClick={() => {
                setEditedUser(userData);
                setIsEditing(false);
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-roboto mb-20"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Log Out
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <></>
      </div>
    </div>
  );
}

export default MainComponent;
