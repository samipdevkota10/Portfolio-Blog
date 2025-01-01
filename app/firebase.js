import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApGqAGOwySR60iR4XhpXZDEgkzFkSDHjs",
  authDomain: "portfolio-blog-2915a.firebaseapp.com",
  projectId: "portfolio-blog-2915a",
  storageBucket: "portfolio-blog-2915a.appspot.com", // Fixed typo here
  messagingSenderId: "619490649902",
  appId: "1:619490649902:web:4fc6ebbaec3205b9457cbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Database
const db = getFirestore(app);



export { db };
