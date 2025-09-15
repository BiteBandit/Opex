// Firebase v9 Modular Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// 🔥 Firebase Config
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
const db = getFirestore(app);
const auth = getAuth(app);

// 🔐 Hardcoded OPEX Token
const correctOpexToken = "OPEX123";

// Elements
const methodSelect = document.getElementById("method");
const cryptoFields = document.getElementById("cryptoFields");
const paypalFields = document.getElementById("paypalFields");
const bankFields = document.getElementById("bankFields");
let currentUserId = null;

// Show/Hide fields based on method
methodSelect.addEventListener("change", function () {
  cryptoFields.classList.add("hidden");
  paypalFields.classList.add("hidden");
  bankFields.classList.add("hidden");

  if (this.value === "crypto") cryptoFields.classList.remove("hidden");
  if (this.value === "paypal") paypalFields.classList.remove("hidden");
  if (this.value === "bank") bankFields.classList.remove("hidden");
});

// Detect logged-in user
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;
    console.log("Logged in as:", user.email);
  } else {
    Swal.fire("Not Logged In", "Please log in to withdraw funds.", "error");
  }
});

// Handle Withdrawal
document
  .getElementById("withdrawForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      return Swal.fire("Error", "You must be logged in!", "error");
    }

    const amount = parseFloat(document.getElementById("amount").value);
    const method = methodSelect.value;
    const opexToken = document.getElementById("opexToken").value.trim();

    if (!method)
      return Swal.fire("Error", "Please select a payment method.", "error");

    // Validate Token
    if (opexToken !== correctOpexToken) {
      return Swal.fire(
        "Invalid Token",
        "Your OPEX token is incorrect. Please purchase a valid token.",
        "error"
      );
    }

    try {
      // Get user balance
      const userRef = doc(db, "users", currentUserId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists())
        return Swal.fire("Error", "User not found.", "error");

      let balance = userDoc.data().balance || 0;
      if (amount > balance) {
        return Swal.fire(
          "Insufficient Funds",
          "You do not have enough balance.",
          "error"
        );
      }

      // Deduct balance
      await updateDoc(userRef, { balance: balance - amount });
      Swal.fire("Success", `Withdrawal of $${amount} successful!`, "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    }
  });
