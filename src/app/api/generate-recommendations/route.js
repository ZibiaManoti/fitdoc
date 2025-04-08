import { db } from "../../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if there are recent recommendations
    const recsQuery = query(
      collection(db, "ai_recommendations"),
      where("userId", "==", userId)
    );

    const recsSnapshot = await getDocs(recsQuery);
    if (!recsSnapshot.empty) {
      const recommendations = recsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return new Response(JSON.stringify({ recommendations }), { status: 200 });
    }

    // If no recommendations exist, generate new ones
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const userData = userDoc.data();

    // Fetch user's exercises
    const exercisesSnapshot = await getDocs(
      query(collection(db, "exercises"), where("userId", "==", userId))
    );
    const exercises = exercisesSnapshot.docs.map((doc) => doc.data());

    // AI Recommendation Request
    const response = await fetch(
      `${process.env.BASE_URL}/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an AI coach providing fitness recommendations.",
            },
            {
              role: "user",
              content: `Generate recommendations for ${userId} based on: ${JSON.stringify(
                userData
              )}, exercises: ${JSON.stringify(exercises)}`,
            },
          ],
          json_schema: {
            name: "fitness_recommendation",
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to generate recommendations");

    const aiResponse = await response.json();
    console.log("🧠 Raw AI response:", aiResponse);
    const recommendations = aiResponse.choices?.[0]?.message?.content
      ? JSON.parse(aiResponse.choices[0].message.content).recommendations
      : [];

    // Store recommendations in Firestore
    const batch = recommendations.map((rec) =>
      addDoc(collection(db, "ai_recommendations"), {
        userId,
        createdAt: serverTimestamp(),
        ...rec,
      })
    );
    await Promise.all(batch);

    return new Response(JSON.stringify({ recommendations }), { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/generate-recommendations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
