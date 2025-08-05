// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEnkJN4FJH3aX18PAGR8UlFR9HfpLCWG0",
  authDomain: "roles-finance.firebaseapp.com",
  projectId: "roles-finance",
  storageBucket: "roles-finance.firebasestorage.app",
  messagingSenderId: "366249881587",
  appId: "1:366249881587:web:82f080c43874fba6fc6c86",
  measurementId: "G-S4M80FJTZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);