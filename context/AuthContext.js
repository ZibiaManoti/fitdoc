"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("👀 Checking authentication state...");

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        console.log("✅ User signed in:", authUser.uid);

        try {
          const userDocRef = doc(db, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: authUser.uid, email: authUser.email, ...userData });

            if (
              !userData.onboardingComplete &&
              router.pathname !== "/onboarding"
            ) {
              router.push("/onboarding");
            } else if (router.pathname === "/") {
              router.push("/dashboard");
            }
          } else {
            console.warn(
              "⚠️ No Firestore document found for user:",
              authUser.uid
            );
          }
        } catch (error) {
          console.error("❌ Error fetching user document:", error);
        }
      } else {
        console.log("❌ No user signed in");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signUp(email, password, fullName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, { displayName: fullName });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName,
        email,
        onboardingComplete: false,
        createdAt: new Date(),
        healthMetrics: { weight: 0, height: 0, bmi: 0 },
        fitnessGoals: { goalType: "maintenance", targetWeight: 0 },
      });

      return userCredential;
    } catch (error) {
      console.error("❌ Error in sign-up:", error);
      throw error;
    }
  }

  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logOut() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, signUp, logIn, logOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
