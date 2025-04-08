// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuBHFp15tl4TvYri6AHQZRCqeYdlrXoa0",
  authDomain: "fitdoc-a6233.firebaseapp.com",
  projectId: "fitdoc-a6233",
  storageBucket: "fitdoc-a6233.appspot.com",
  messagingSenderId: "997853061248",
  appId: "1:997853061248:web:24148c0ab234c70c600665",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
