import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Replace these values with your Firebase project config
// Get them from: console.firebase.google.com → your project → Project Settings → Web App
const firebaseConfig = {
   apiKey: "AIzaSyAdOIEZPCjQI1ggqpHLNkLaTpk53Z_7taQ",
  authDomain: "paybackbuddy.firebaseapp.com",
  projectId: "paybackbuddy",
  storageBucket: "paybackbuddy.firebasestorage.app",
  messagingSenderId: "",
  appId: "1:728620530492:web:aff238a16640ba2b9ffc39",
  measurementId: ""
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };