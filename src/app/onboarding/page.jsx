"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";

function OnboardingForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    goalWeight: "",
    activityLevel: "",
    fitnessGoals: [],
    healthConditions: ["None"], // Default to "None" selected
    dietaryRestrictions: ["None"], // Default to "None" selected
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  const activityLevels = [
    { value: "sedentary", label: "Sedentary (little or no exercise)" },
    { value: "light", label: "Lightly active (1-3 days/week)" },
    { value: "moderate", label: "Moderately active (3-5 days/week)" },
    { value: "very", label: "Very active (6-7 days/week)" },
    { value: "extra", label: "Extra active (physical job or training)" },
  ];

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter((item) => item !== value),
        };
      }
      return { ...prev, [field]: [...currentValues, value] };
    });
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError("Name is required");
          return false;
        }
        if (
          !formData.age ||
          parseInt(formData.age) < 13 ||
          parseInt(formData.age) > 120
        ) {
          setError("Please enter a valid age (13-120)");
          return false;
        }
        if (!formData.gender) {
          setError("Gender is required");
          return false;
        }
        break;

      case 2:
        if (
          !formData.weight ||
          parseFloat(formData.weight) < 30 ||
          parseFloat(formData.weight) > 300
        ) {
          setError("Please enter a valid weight (30-300 kg)");
          return false;
        }
        if (
          !formData.height ||
          parseFloat(formData.height) < 100 ||
          parseFloat(formData.height) > 250
        ) {
          newError = "Please enter a valid height (100-250 cm)";
          if (!formData.goalWeight) setError("Goal weight is required");
          return false;
        }
        break;

      case 3:
        if (!formData.activityLevel) {
          setError("Activity level is required");
          return false;
        }
        if (formData.fitnessGoals.length === 0) {
          setError("Please select at least one fitness goal");
          return false;
        }
        break;
    }

    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep() || isSubmitting || !user) return;

    setIsSubmitting(true);

    try {
      // Filter out "None" if other options are selected
      const healthConditions =
        formData.healthConditions.includes("None") &&
        formData.healthConditions.length > 1
          ? formData.healthConditions.filter((c) => c !== "None")
          : formData.healthConditions;

      const dietaryRestrictions =
        formData.dietaryRestrictions.includes("None") &&
        formData.dietaryRestrictions.length > 1
          ? formData.dietaryRestrictions.filter((r) => r !== "None")
          : formData.dietaryRestrictions;

      // Save onboarding data to Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name: formData.name.trim(),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        goalWeight: parseFloat(formData.goalWeight),
        activityLevel: formData.activityLevel,
        fitnessGoals: formData.fitnessGoals,
        healthConditions,
        dietaryRestrictions,
        birthDate: new Date(
          new Date().setFullYear(
            new Date().getFullYear() - parseInt(formData.age)
          )
        ).toISOString(),
        onboardingComplete: true, // Mark onboarding as complete in Firestore
        createdAt: serverTimestamp(),
      });

      // Initiate AI recommendations in background
      const aiResponse = await fetch("/api/generate-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, context: formData }),
      }).catch(console.error);

      if (!aiResponse.ok) {
        console.warn("Warning: Failed to generate initial AI recommendations");
      } else {
        console.log("AI recommendations generated successfully");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      setError(error.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your full name"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Age</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your age"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>
    </div>
  );

  const renderMeasurements = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-2">Current Weight (kg)</label>
        <input
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your current weight"
          step="0.1"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Height (cm)</label>
        <input
          type="number"
          name="height"
          value={formData.height}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your height"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Goal Weight (kg)</label>
        <input
          type="number"
          name="goalWeight"
          value={formData.goalWeight}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your goal weight"
          step="0.1"
        />
      </div>
    </div>
  );

  const renderFitnessProfile = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-2">Activity Level</label>
        <select
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select activity level</option>
          {activityLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Fitness Goals</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {fitnessGoalOptions.map((goal) => (
            <div
              key={goal}
              className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.fitnessGoals.includes(goal)}
                onChange={() => handleCheckboxChange("fitnessGoals", goal)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label>{goal}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHealthInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-2">Health Conditions</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {healthConditionOptions.map((condition) => (
            <div
              key={condition}
              className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.healthConditions.includes(condition)}
                onChange={() =>
                  handleCheckboxChange("healthConditions", condition)
                }
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label>{condition}</label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Dietary Restrictions</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {dietaryRestrictionOptions.map((restriction) => (
            <div
              key={restriction}
              className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.dietaryRestrictions.includes(restriction)}
                onChange={() =>
                  handleCheckboxChange("dietaryRestrictions", restriction)
                }
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <label>{restriction}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 font-roboto">
            Welcome to FitDoc
          </h2>
          <p className="mt-2 text-gray-600 font-roboto">
            Let's get to know you better
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-1/4 h-2 rounded-full ${
                    stepNumber <= step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
            <p className="text-center text-gray-600 font-roboto">
              Step {step} of 4
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {step === 1 && renderPersonalInfo()}
          {step === 2 && renderMeasurements()}
          {step === 3 && renderFitnessProfile()}
          {step === 4 && renderHealthInfo()}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-roboto"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-roboto ml-auto ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : step === 4 ? (
                "Complete"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingForm;
