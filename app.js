import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

if (loginBtn) {
    loginBtn.addEventListener('click', async(e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        loginError.style.display = 'none';
        loginBtn.textContent = 'Вход...';
        loginBtn.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            loginError.style.display = 'block';
            loginError.textContent = error.message;
            loginBtn.textContent = 'Войти';
            loginBtn.disabled = false;
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.remove('active');
        appContent.classList.add('active');
    } else {
        loginScreen.classList.add('active');
        appContent.classList.remove('active');
    }
});