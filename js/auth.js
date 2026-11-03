import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


// ===============================
// REGISTER
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");

        message.textContent = "Creating account...";

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name
            });

            message.textContent =
                "Registration successful!";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        }

        catch (error) {

            console.error(error);

            if (error.code === "auth/email-already-in-use") {

                message.textContent =
                    "This email is already registered.";

            }

            else if (error.code === "auth/invalid-email") {

                message.textContent =
                    "Please enter a valid email.";

            }

            else if (error.code === "auth/weak-password") {

                message.textContent =
                    "Password must be at least 6 characters.";

            }

            else {

                message.textContent =
                    "Registration failed: " + error.message;

            }

        }

    });

}


// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            message.textContent =
                "Login successful!";

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 1000);

        }

        catch (error) {

            console.error(error);

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password"
            ) {

                message.textContent =
                    "Incorrect email or password.";

            }

            else if (error.code === "auth/user-not-found") {

                message.textContent =
                    "User not found. Please register first.";

            }

            else if (error.code === "auth/invalid-email") {

                message.textContent =
                    "Please enter a valid email.";

            }

            else {

                message.textContent =
                    "Login failed: " + error.message;

            }

        }

    });

}