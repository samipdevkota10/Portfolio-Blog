// firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApGqAGOwySR60iR4XhpXZDEgkzFkSDHjs",
  projectId: "portfolio-blog-2915a",
  storageBucket: "portfolio-blog-2915a.firebasestorage.app",
  messagingSenderId: "619490649902",
  appId: "1:619490649902:web:4fc6ebbaec3205b9457cbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const storage = getStorage(app);

// Export initialized services
export { db,storage };
