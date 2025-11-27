import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC0sF2MwocXXa0P5jlqZ-f6VrqMWJXfZDE",
  authDomain: "boookbox-bf787.firebaseapp.com",
  projectId: "boookbox-bf787",
  storageBucket: "boookbox-bf787.firebasestorage.app",
  messagingSenderId: "811899940288",
  appId: "1:811899940288:web:bdfe4f194bd4aeacefac25",
  measurementId: "G-MFLZ497RW4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Analytics (only in production)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined" && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export { analytics, app };
