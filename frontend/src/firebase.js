// Initialize Firebase

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC35vkEGuN04IAW-gnuW-NTEVAIm1CYU6s",
  authDomain: "troco-6c56c.firebaseapp.com",
  projectId: "troco-6c56c",
  storageBucket: "troco-6c56c.firebasestorage.app",
  messagingSenderId: "89375482940",
  appId: "1:89375482940:web:96680ec31c5d7c3892cf39"
};

const app = initializeApp(firebaseConfig);

// 🔥 exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);