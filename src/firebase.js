import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your project's customized Firebase configuration
// These values are often found in the Firebase Console under Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "bit-hackathon-506ca.firebaseapp.com",
  projectId: "bit-hackathon-506ca",
  storageBucket: "bit-hackathon-506ca.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
