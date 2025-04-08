import { db } from "../../../../firebase";
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import admin from "firebase-admin"; // Import Firebase Admin SDK
import { NextResponse } from "next/server";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// Helper function to verify Firebase token
async function verifyToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Main POST function
export async function POST(req) {
  try {
    const userIdFromToken = await verifyToken(req);
    if (!userIdFromToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const { userId, action, exerciseId, exercise } = await req.json();

    // 🔥 Ensure that the userId from the request matches the authenticated user
    if (userId !== userIdFromToken) {
      return NextResponse.json(
        { error: "Forbidden: User ID mismatch" },
        { status: 403 }
      );
    }

    console.log("Received request:", { userId, action, exerciseId, exercise });

    const exercisesRef = collection(db, "exercises");

    switch (action) {
      case "create":
        if (!exercise || !exercise.name || typeof exercise.name !== "string") {
          return NextResponse.json(
            { error: "Valid exercise data is required" },
            { status: 400 }
          );
        }

        const newExercise = {
          userId,
          name: exercise.name.trim(),
          category_id: exercise.category_id,
          is_ai_recommended: true,
          created_at: new Date().toISOString(),
          duration: exercise.duration || null,
          length: exercise.length || null,
          time: exercise.time || null,
          sets: exercise.sets || null,
          reps: exercise.reps || null,
          weight_kg: exercise.weight_kg || null,
        };

        // Handle category-specific properties
        if (exercise.category_id === 2) {
          // Cardio
          if (!exercise.duration) {
            return NextResponse.json(
              { error: "Duration is required for cardio exercises" },
              { status: 400 }
            );
          }
          newExercise.duration = exercise.duration;
        } else if (exercise.category_id === 3) {
          // Flexibility
          if (!exercise.time) {
            return NextResponse.json(
              { error: "Time is required for flexibility exercises" },
              { status: 400 }
            );
          }
          newExercise.time = exercise.time;
        } else if (exercise.category_id === 4) {
          // Balance
          if (!exercise.duration) {
            return NextResponse.json(
              { error: "Duration is required for balance exercises" },
              { status: 400 }
            );
          }
          newExercise.duration = exercise.duration;
        } else {
          newExercise.sets = exercise.sets || null;
          newExercise.reps = exercise.reps || null;
          newExercise.weight_kg = exercise.weight_kg || null;
        }

        const docRef = await addDoc(exercisesRef, newExercise);
        return NextResponse.json(
          { success: true, exercise: { id: docRef.id, ...newExercise } },
          { status: 201 }
        );

      case "update":
        if (!exerciseId) {
          return NextResponse.json(
            { error: "Exercise ID is required" },
            { status: 400 }
          );
        }

        const exerciseRef = doc(exercisesRef, exerciseId);
        const docSnap = await getDoc(exerciseRef);

        if (!docSnap.exists()) {
          return NextResponse.json(
            { error: "Exercise not found" },
            { status: 404 }
          );
        }

        await updateDoc(exerciseRef, exercise);
        return NextResponse.json(
          { success: true, exercise: { id: exerciseId, ...exercise } },
          { status: 200 }
        );

      case "delete":
        if (!exerciseId) {
          return NextResponse.json(
            { error: "Exercise ID is required" },
            { status: 400 }
          );
        }

        const deleteRef = doc(exercisesRef, exerciseId);
        const deleteSnap = await getDoc(deleteRef);

        if (!deleteSnap.exists()) {
          return NextResponse.json(
            { error: "Exercise not found" },
            { status: 404 }
          );
        }

        await deleteDoc(deleteRef);
        return NextResponse.json({ success: true }, { status: 200 });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing exercise:", error);
    return NextResponse.json(
      { error: "Failed to manage exercise", details: error.message },
      { status: 500 }
    );
  }
}
