// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* ====== REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG ====== */
const firebaseConfig = {
  apiKey: "AIzaSyDcofrjnR6xSmtzuGrhJBHxPBXMdyMZZgQ",
  authDomain: "majikstar-40e60.firebaseapp.com",
  projectId: "majikstar-40e60",
  storageBucket: "majikstar-40e60.firebasestorage.app",
  messagingSenderId: "586463286912",
  appId: "1:586463286912:web:53ccdc8f59d603c095b865",
  measurementId: "G-9KMJWEKZL2",
};
/* ============================================================ */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ---------- DOM selectors (match your HTML) ---------- */
const usernameEl = document.getElementById("username") || null;
const balanceEls = Array.from(document.querySelectorAll(".user-balance"));
const cardEls = Array.from(document.querySelectorAll(".card-number"));
const transfersList = document.getElementById("transfers-list") || null;

/* ---------- helpers ---------- */
const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const genLast4 = () => String(Math.floor(1000 + Math.random() * 9000));

async function ensureUserDoc(uid, fallbackName = "User", fallbackEmail = null) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const newDoc = {
      username: fallbackName,
      email: fallbackEmail,
      balance: 0,
      pendingEarnings: 0,
      role: "user",
      cardLast4: genLast4(),
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newDoc);
    return newDoc;
  } else {
    const data = snap.data();
    const toUpdate = {};
    if (!("username" in data)) toUpdate.username = fallbackName;
    if (!("balance" in data)) toUpdate.balance = 0;
    if (!("pendingEarnings" in data)) toUpdate.pendingEarnings = 0;
    if (!("role" in data)) toUpdate.role = "user";
    if (!("cardLast4" in data)) toUpdate.cardLast4 = genLast4();
    if (!("createdAt" in data)) toUpdate.createdAt = serverTimestamp();

    if (Object.keys(toUpdate).length) {
      await updateDoc(ref, toUpdate);
      return { ...data, ...toUpdate };
    }
    return data;
  }
}

function renderUserUI(data = {}, uid = null) {
  // username
  const name =
    data.username || (data.email ? data.email.split("@")[0] : "User");
  if (usernameEl) usernameEl.textContent = name;

  // balance -> update all elements with .user-balance
  const balanceText = formatMoney(data.balance || 0);
  if (balanceEls.length > 0) {
    balanceEls.forEach((el) => (el.textContent = balanceText));
  }

  // card last4 -> update all .card-number
  const last4 = data.cardLast4 || genLast4();
  if (cardEls.length > 0) {
    cardEls.forEach((el) => (el.textContent = `•••• ${last4}`));
  }

  // user id display (if you later add a #user-id)
  const userIdEl = document.getElementById("user-id");
  if (userIdEl && uid) userIdEl.textContent = uid;

  // transfers placeholder (you can fetch and render real data here later)
  if (
    transfersList &&
    (!transfersList.innerHTML || transfersList.innerHTML.trim() === "")
  ) {
    transfersList.innerHTML = `<div class="transfer-empty">No transactions yet</div>`;
  }
}

/* ---------- main auth watcher ---------- */
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      console.log("No authenticated user. Dashboard requires login.");
      // set sane defaults
      if (usernameEl) usernameEl.textContent = "Not logged in";
      balanceEls.forEach((el) => (el.textContent = formatMoney(0)));
      cardEls.forEach((el) => (el.textContent = `•••• 0000`));
      return;
    }

    // ensure user doc exists and has required fields
    const fallbackName =
      user.displayName || (user.email ? user.email.split("@")[0] : "User");
    await ensureUserDoc(user.uid, fallbackName, user.email || null);

    // fetch fresh doc and render
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    renderUserUI(data, user.uid);

    console.log("Dashboard initialized for", user.uid);
  } catch (err) {
    console.error("Error initializing dashboard:", err);
  }
});

/* ---------- optional: expose balance updater for quick testing ---------- */
window._updateBalance = async function (newBalance) {
  const current = auth.currentUser;
  if (!current) throw new Error("No signed-in user");
  const ref = doc(db, "users", current.uid);
  await updateDoc(ref, { balance: Number(newBalance) });
  const snap = await getDoc(ref);
  if (snap.exists()) renderUserUI(snap.data(), current.uid);
};

/* ---------- optional: logout helper in case you add a logout control ---------- */
window._logout = async function () {
  try {
    await signOut(auth);
    window.location.href = "auth.html";
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

// Assuming you already have userId from auth
const userId = firebase.auth().currentUser.uid;

// Reference to the container
const transfersList = document.querySelector(".transfers-list");

// Fetch transactions for this user
db.collection("transactions")
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc")
  .get()
  .then((querySnapshot) => {
    transfersList.innerHTML = ""; // Clear old data

    if (querySnapshot.empty) {
      transfersList.innerHTML = "<p>No transactions yet.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount;
      const type = data.type;
      const date = data.createdAt
        ? data.createdAt.toDate().toLocaleString()
        : "N/A";

      // Create message and row styling
      let message = "";
      const row = document.createElement("div");
      row.classList.add("transaction-item");

      if (type === "admin_topup") {
        message = `You just received $${amount}`;
        row.classList.add("transaction-received");
      } else if (type === "withdrawal") {
        message = `You withdrew $${amount}`;
        row.classList.add("transaction-withdrawal");
      } else {
        message = `${type}: $${amount}`;
      }

      // Build row
      row.innerHTML = `
        <div class="transaction-details">
          <p class="transaction-type">${message}</p>
          <p class="transaction-date">${date}</p>
        </div>
      `;
      transfersList.appendChild(row);
    });
  })
  .catch((error) => {
    console.error("Error fetching transactions:", error);
    transfersList.innerHTML = "<p>Error loading transactions.</p>";
  });

