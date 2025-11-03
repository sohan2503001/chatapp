// client/src/firebaseRTDB.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// We can re-use the *same* config from firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Add the databaseURL from your new Realtime Database
  databaseURL: "https://chat-app-56c3f-default-rtdb.asia-southeast1.firebasedatabase.app/" // e.g., https://chat-app-test-2-default-rtdb.firebaseio.com
};

const app = initializeApp(firebaseConfig, "rtdb"); // Use a name to avoid conflicts
export const rtdb = getDatabase(app);