// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-FJa9iyCie_RbGfypWKoINjWClrOMfCY",
  authDomain: "delivery-tracker-2fb65.firebaseapp.com",
  databaseURL: "https://delivery-tracker-2fb65-default-rtdb.firebaseio.com",
  projectId: "delivery-tracker-2fb65",
  storageBucket: "delivery-tracker-2fb65.firebasestorage.app",
  messagingSenderId: "5862383581",
  appId: "1:5862383581:web:6851b9a84aec6a85942034",
  measurementId: "G-P8K0DWPR4P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);