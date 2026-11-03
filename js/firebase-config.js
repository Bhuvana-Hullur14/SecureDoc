import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrmuSqxT9sxzbsMHN8YX7_8lf6mo3Eses",
    authDomain: "doc-ef0ae.firebaseapp.com",
    projectId: "doc-ef0ae",
    storageBucket: "doc-ef0ae.firebasestorage.app",
    messagingSenderId: "840444972074",
    appId: "1:840444972074:web:71340ff0f849f5f59d8753"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };