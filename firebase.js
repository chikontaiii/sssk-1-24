import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAAkX1LEW6JywRHn-vp10SZhjeFa9RbcQk",
    authDomain: "sssk-1-24.firebaseapp.com",
    projectId: "sssk-1-24",
    storageBucket: "sssk-1-24.firebasestorage.app",
    messagingSenderId: "392904114221",
    appId: "1:392904114221:web:de75a5c2903da52affb8a4",
    measurementId: "G-WGCCCS47S8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };