"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext"; // Ensure you import these properly

function Navigation({ currentPath = "/" }) {
  const { signOut, user } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "fa-home" },
    { path: "/workouts", label: "Workouts", icon: "fa-dumbbell" },
    { path: "/nutrition", label: "Nutrition", icon: "fa-utensils" },
    { path: "/insights", label: "Insights", icon: "fa-chart-line" },
  ];

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/account/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-orange-600">
                FitTrack
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map(({ path, label, icon }) => (
                <a
                  key={path}
                  href={path}
                  className={`px-3 py-2 text-sm font-medium inline-flex items-center space-x-2 ${
                    currentPath === path
                      ? "text-orange-600 border-b-2 border-orange-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <i
                    className={`fas ${icon} ${
                      currentPath === path ? "text-orange-600" : "text-gray-400"
                    }`}
                  ></i>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/profile"
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <i className="fas fa-user text-gray-400"></i>
              <span>{user?.name || "Profile"}</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <i className="fas fa-sign-out-alt text-gray-400"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function NavigationContainer() {
  return <Navigation currentPath="/dashboard" />;
}
