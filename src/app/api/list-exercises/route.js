import { NextResponse } from "next/server";
import { db } from "../../../../firebase"; // Adjust path if needed
import { collection, getDocs, query, where } from "firebase/firestore";

// Next.js API route for GET requests
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Querying exercises collection where userId matches
    let exercisesQuery = query(
      collection(db, "exercises"),
      where("userId", "==", userId) // Filtering by userId
    );

    if (categoryId) {
      exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", userId),
        where("category_id", "==", categoryId) // Filtering by category if provided
      );
    }

    const snapshot = await getDocs(exercisesQuery);
    const exercises = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ exercises }, { status: 200 });
  } catch (error) {
    console.error("🔥 Error fetching exercises:", error.message);
    return NextResponse.json(
      { error: `Failed to fetch exercises: ${error.message}` },
      { status: 500 }
    );
  }
}
