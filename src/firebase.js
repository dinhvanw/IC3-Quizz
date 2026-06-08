// Replace the following config with your Firebase project's config
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBhe1fHhZtw4ajBphJV1meyNQ1HfF_V0UE",
  authDomain: "ic3-quizz.firebaseapp.com",
  projectId: "ic3-quizz",
  storageBucket: "ic3-quizz.firebasestorage.app",
  messagingSenderId: "532814014579",
  appId: "1:532814014579:web:5a232764e9e9dec0fc2206",
  measurementId: "G-Z3M2KGMRDP"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Re-export auth methods for convenience
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged }
