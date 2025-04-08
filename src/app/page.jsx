"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

function MainComponent() {
  const router = useRouter();
  const { user, userData, loading } = useAuth(); // Ensure `userData` includes `onboardingComplete`
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (loading) return; // Wait for auth state to load

    if (!user) {
      router.replace("/account/signin?callbackUrl=/onboarding");
    } else if (user && !userData?.onboardingComplete) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [user, userData, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {authError ? (
        <>
          <div className="text-red-500 text-4xl">⚠️</div>
          <p className="text-red-600">{authError}</p>
          <button
            onClick={() => setAuthError(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </>
      )}
    </div>
  );
}

export default MainComponent;
