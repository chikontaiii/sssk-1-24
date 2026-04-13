import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDNrR5Mxd9xG3C5354EF96r7CKWZme9FXM",
    authDomain: "pks-7-24-portal.firebaseapp.com",
    projectId: "pks-7-24-portal",
    storageBucket: "pks-7-24-portal.firebasestorage.app",
    messagingSenderId: "657797301237",
    appId: "1:657797301237:web:9be5433f4444b3896d56bc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };