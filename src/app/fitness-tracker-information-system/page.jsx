"use client";
import React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";

function MainComponent() {
  const [activeTab, setActiveTab] = useState("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();
  const [showSignup, setShowSignup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [userDetails, setUserDetails] = useState({
    name: "",
    age: 0,
    weight: 0,
    height: 0,
    goalWeight: 0,
  });
  const [metrics, setMetrics] = useState({
    heartRate: 75,
    caloriesBurned: 320,
    stepsToday: 6500,
    waterIntake: 5,
    exerciseMinutes: 45,
  });

  const { user, loading, signUp, logIn, logOut } = useAuth();

  //Login Details
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  //Signup Details
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error(err);
    }
  };

  const [exercises, setExercises] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({
    activity: "",
    duration: "",
    time: "",
  });
  const [showMetricsForm, setShowMetricsForm] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setActiveTab("dashboard");
    }
  }, []);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const response = await fetch(
          "/integrations/qr-code/generatebasicbase64?data=https://fittrackpro.app/download"
        );
        const data = await response.text();
        setQrCode(data);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };
    generateQR();
  }, []);

  const handleNavigation = () => {
    if (isAuthenticated) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("landing");
      setShowLogin(false);
      setShowSignup(false);
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(loginEmail, loginPassword);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (signupPassword !== signupConfirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      await signUp(signupEmail, signupPassword, fullName);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  function renderLoginForm() {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-roboto">
          Login
        </h2>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-roboto"
          >
            Login
          </button>
        </form>
      </div>
    );
  }
  function renderSignupForm() {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-roboto">
          Register
        </h2>
        <form className="space-y-4" onSubmit={handleSignupSubmit}>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={signupForm.confirmPassword}
              onChange={(e) =>
                setSignupForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-roboto"
          >
            Create Account
          </button>
        </form>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 font-roboto">
            Welcome back, {userDetails.name}!
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold font-roboto">
                  Today's Stats
                </h2>
                <button
                  onClick={() => setShowMetricsForm(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <i className="fas fa-edit"></i> Update Stats
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Heart Rate:</span>
                  <span className="font-semibold">{metrics.heartRate} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories Burned:</span>
                  <span className="font-semibold">
                    {metrics.caloriesBurned} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Steps:</span>
                  <span className="font-semibold">{metrics.stepsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Intake:</span>
                  <span className="font-semibold">
                    {metrics.waterIntake} glasses
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exercise Duration:</span>
                  <span className="font-semibold">
                    {metrics.exerciseMinutes} mins
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4 font-roboto">
                Exercise Builder
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setExercises([...exercises, exerciseForm]);
                  setExerciseForm({ activity: "", duration: "", time: "" });
                }}
                className="space-y-4 mb-6"
              >
                <div>
                  <label className="block text-gray-600 mb-2">Activity</label>
                  <input
                    type="text"
                    value={exerciseForm.activity}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        activity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Running"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={exerciseForm.duration}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        duration: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Time</label>
                  <input
                    type="time"
                    value={exerciseForm.time}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Add Exercise
                </button>
              </form>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Today's Activities
                </h3>
                {exercises.length === 0 ? (
                  <p className="text-gray-500">No exercises added yet</p>
                ) : (
                  <div className="space-y-2">
                    {exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded"
                      >
                        <div>
                          <p className="font-medium">{exercise.activity}</p>
                          <p className="text-sm text-gray-600">
                            {exercise.time} - {exercise.duration} mins
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setExercises(
                              exercises.filter((_, i) => i !== index)
                            )
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showMetricsForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Update Today's Stats</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  setMetrics({
                    heartRate: parseInt(formData.get("heartRate")),
                    caloriesBurned: parseInt(formData.get("caloriesBurned")),
                    stepsToday: parseInt(formData.get("stepsToday")),
                    waterIntake: parseInt(formData.get("waterIntake")),
                    exerciseMinutes: parseInt(formData.get("exerciseMinutes")),
                  });
                  setShowMetricsForm(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-600 mb-2">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    name="heartRate"
                    defaultValue={metrics.heartRate}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    name="caloriesBurned"
                    defaultValue={metrics.caloriesBurned}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Steps Today
                  </label>
                  <input
                    type="number"
                    name="stepsToday"
                    defaultValue={metrics.stepsToday}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Water Intake (glasses)
                  </label>
                  <input
                    type="number"
                    name="waterIntake"
                    defaultValue={metrics.waterIntake}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">
                    Exercise Duration (mins)
                  </label>
                  <input
                    type="number"
                    name="exerciseMinutes"
                    defaultValue={metrics.exerciseMinutes}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMetricsForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderLanding() {
    return (
      <div className="space-y-20">
        <div className="text-center py-12 px-4 relative">
          <img
            src="https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=800"
            alt="Fitness tracking app interface showing workout statistics"
            className="absolute inset-0 w-full h-full object-cover opacity-10 z-0"
          />
          <div className="relative z-10">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 font-roboto">
              Transform Your Fitness Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-roboto">
              Track your workouts, monitor your nutrition, and achieve your
              fitness goals with FitTrack Pro's comprehensive solution.
            </p>
            <div className="space-y-8">
              <div className="space-x-4">
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setShowSignup(false);
                    setActiveTab("");
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors font-roboto"
                >
                  Start Your Journey
                </button>
              </div>
              {qrCode && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-lg font-roboto">
                    Scan to download our mobile app
                  </p>
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code to download FitDoc mobile app"
                    className="w-40 h-40"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=800"
              alt="Fitness app workout tracking interface"
              className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=1000"
              alt="Fitness app nutrition tracking dashboard"
              className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
            />
          </div>
        </div>

        <div
          id="features"
          className="py-16 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800')`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 bg-white/90 py-12 rounded-xl">
            <h2 className="text-3xl font-bold text-center mb-12 font-roboto">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6">
                <i className="fas fa-heartbeat text-4xl text-orange-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 font-roboto">
                  Real-time Health Tracking
                </h3>
                <p className="text-gray-600 font-roboto">
                  Monitor your vital signs and activity metrics in real-time
                </p>
              </div>
              <div className="text-center p-6">
                <i className="fas fa-brain text-4xl text-orange-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 font-roboto">
                  Personalized Recommendations
                </h3>
                <p className="text-gray-600 font-roboto">
                  Get AI-powered suggestions tailored to your goals
                </p>
              </div>
              <div className="text-center p-6">
                <i className="fas fa-chart-line text-4xl text-orange-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 font-roboto">
                  Comprehensive Analytics
                </h3>
                <p className="text-gray-600 font-roboto">
                  Detailed insights into your fitness progress
                </p>
              </div>
              <div className="text-center p-6">
                <i className="fas fa-utensils text-4xl text-orange-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2 font-roboto">
                  Nutrition Planning
                </h3>
                <p className="text-gray-600 font-roboto">
                  Custom meal plans and nutrition tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderUserDetailsForm() {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-roboto">
          Enter Your Details
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setUser({
              name: e.target.name.value,
              age: parseInt(e.target.age.value),
              weight: parseFloat(e.target.weight.value),
              height: parseFloat(e.target.height.value),
              goalWeight: parseFloat(e.target.goalWeight.value),
            });
            setActiveTab("dashboard");
          }}
        >
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">Age</label>
            <input
              type="number"
              name="age"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              step="0.1"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Height (cm)
            </label>
            <input
              type="number"
              name="height"
              step="0.1"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-roboto">
              Goal Weight (kg)
            </label>
            <input
              type="number"
              name="goalWeight"
              step="0.1"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-roboto"
          >
            Save Details
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
      />
      <header className="fixed w-full bg-white shadow-md z-50">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center hover:opacity-90 transition-opacity">
              <div className="mr-3 text-2xl text-orange-600 hidden sm:block">
                <i className="fas fa-heartbeat text-3xl"></i>
              </div>
              <button
                onClick={handleNavigation}
                className="text-2xl font-bold text-orange-600"
              >
                FitDoc
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={handleNavigation}
                className="text-gray-700 hover:text-orange-600"
              >
                Home
              </button>
              <a
                href="/workouts"
                className="text-gray-700 hover:text-orange-600"
              >
                Workouts
              </a>
              <a
                href="/nutrition"
                className="text-gray-700 hover:text-orange-600"
              >
                Nutrition
              </a>
              <a
                href="/insights"
                className="text-gray-700 hover:text-orange-600"
              >
                Insights
              </a>
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setShowSignup(false);
                      setActiveTab("");
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowSignup(true);
                      setShowLogin(false);
                      setActiveTab("");
                    }}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Register
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          <>
            {activeTab === "landing" &&
              !showLogin &&
              !showSignup &&
              renderLanding()}
            {showLogin && renderLoginForm()}
            {showSignup && renderSignupForm()}
            {activeTab === "userDetails" && renderUserDetailsForm()}
          </>
        ) : (
          renderDashboard()
        )}
      </main>

      <footer className="bg-gray-900 text-white mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FitDoc</h3>
              <p className="text-gray-400">
                Your complete fitness companion for a healthier lifestyle.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={handleNavigation}
                    className="text-gray-400 hover:text-white"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <a
                    href="/workouts"
                    className="text-gray-400 hover:text-white"
                  >
                    Workouts
                  </a>
                </li>
                <li>
                  <a
                    href="/nutrition"
                    className="text-gray-400 hover:text-white"
                  >
                    Nutrition
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    className="text-gray-400 hover:text-white"
                  >
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Facebook
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FitDoc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;
