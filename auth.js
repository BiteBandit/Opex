// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------------------------
   Replace these with your real Firebase values
   --------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDcofrjnR6xSmtzuGrhJBHxPBXMdyMZZgQ",
  authDomain: "majikstar-40e60.firebaseapp.com",
  projectId: "majikstar-40e60",
  storageBucket: "majikstar-40e60.firebasestorage.app",
  messagingSenderId: "586463286912",
  appId: "1:586463286912:web:53ccdc8f59d603c095b865",
  measurementId: "G-9KMJWEKZL2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* Run after DOM is ready to avoid "null" errors */
document.addEventListener("DOMContentLoaded", () => {
  // DOM refs (these IDs must exist in your HTML)
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const formTitle = document.getElementById("form-title");
  const toggleText = document.getElementById("toggle-text");
  const showSignupBtn = document.getElementById("show-signup"); // optional
  const showLoginBtn = document.getElementById("show-login"); // optional

  // Safe alert helper (uses SweetAlert2 if present, else fallback to alert)
  function showAlert(opts) {
    if (window.Swal && typeof Swal.fire === "function") {
      return Swal.fire(opts);
    } else {
      // minimal fallback
      const title = opts.title || "";
      const text = opts.text || "";
      alert(title + (text ? "\n\n" + text : ""));
      return Promise.resolve();
    }
  }

  // Helper: get input value by ID (returns empty string if not found)
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // Toggle functions (do not inject DOM elements repeatedly)
  function showSignup() {
    if (signupForm) signupForm.style.display = "block";
    if (loginForm) loginForm.style.display = "none";
    if (formTitle) formTitle.textContent = "Sign Up";
    if (toggleText)
      toggleText.innerHTML =
        'Already have an account? <a href="#" id="toggle-link">Login</a>';
    bindToggleLink(); // re-bind the single toggle anchor
  }

  function showLogin() {
    if (signupForm) signupForm.style.display = "none";
    if (loginForm) loginForm.style.display = "block";
    if (formTitle) formTitle.textContent = "Login";
    if (toggleText)
      toggleText.innerHTML =
        'Don\'t have an account? <a href="#" id="toggle-link">Sign Up</a>';
    bindToggleLink();
  }

  // Bind the toggle anchor (single handler, replaces previous handler)
  function bindToggleLink() {
    const tl = document.getElementById("toggle-link");
    if (!tl) return;
    tl.onclick = (e) => {
      e.preventDefault();
      // toggle based on current visible form
      if (loginForm && loginForm.style.display === "none") {
        showLogin();
      } else {
        showSignup();
      }
    };
  }

  // If you have dedicated buttons #show-signup / #show-login bind them
  if (showSignupBtn) {
    showSignupBtn.onclick = (e) => {
      e.preventDefault();
      showSignup();
    };
  }
  if (showLoginBtn) {
    showLoginBtn.onclick = (e) => {
      e.preventDefault();
      showLogin();
    };
  }

  // Ensure there is at least one toggle anchor on load
  bindToggleLink();

  /* ---------------------------
     SIGN UP handler
     Required input IDs in HTML:
       #signup-email
       #signup-name
       #signup-phone
       #signup-country
       #signup-password
     --------------------------- */
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = getVal("signup-email");
      const name = getVal("signup-name");
      const phone = getVal("signup-phone");
      const country = getVal("signup-country");
      const password = getVal("signup-password");

      if (!email || !password || !name) {
        return showAlert({
          icon: "warning",
          title: "Missing fields",
          text: "Please provide your name, email and password.",
        });
      }

      try {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCred.user.uid), {
          name,
          email,
          phone,
          country,
          role: "user",
        });

        await showAlert({
          icon: "success",
          title: "Account Created!",
          text: "You can now log in.",
          timer: 1800,
          showConfirmButton: false,
        });

        showLogin();
      } catch (err) {
        showAlert({
          icon: "error",
          title: "Sign up failed",
          text: err.message || "An error occurred.",
        });
      }
    });
  }

  /* ---------------------------
     LOGIN handler
     Required input IDs in HTML:
       #login-email
       #login-password
     --------------------------- */
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = getVal("login-email");
      const password = getVal("login-password");

      if (!email || !password) {
        return showAlert({
          icon: "warning",
          title: "Missing fields",
          text: "Please enter your email and password.",
        });
      }

      try {
        const userCred = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));

        if (!userDoc.exists()) {
          return showAlert({
            icon: "warning",
            title: "No profile found",
            text: "Please contact support.",
          });
        }

        const user = userDoc.data();
        await showAlert({
          icon: "success",
          title: "Login successful",
          text: `Welcome back${user.name ? ", " + user.name : ""}!`,
          timer: 1400,
          showConfirmButton: false,
        });

        // Redirect based on role
        window.location.href =
          user.role === "admin" ? "admin.html" : "dashboard.html";
      } catch (err) {
        showAlert({
          icon: "error",
          title: "Login failed",
          text: err.message || "An error occurred.",
        });
      }
    });
  }
}); // DOMContentLoaded
