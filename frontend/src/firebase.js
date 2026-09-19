import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD10zaKDxDmVVfhLeOpCc7Yj8qKUQHUn_4",
  authDomain: "prescripto-6fa8d.firebaseapp.com",
  projectId: "prescripto-6fa8d",
  storageBucket: "prescripto-6fa8d.firebasestorage.app",
  messagingSenderId:  "89664168287",
  appId: "1:89664168287:web:8f84b2e6096a6a50df56ea"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);