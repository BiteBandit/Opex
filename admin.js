// ✅ Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Your Firebase Config (replace with your actual values)
const firebaseConfig = {
  apiKey: "AIzaSyDcofrjnR6xSmtzuGrhJBHxPBXMdyMZZgQ",
  authDomain: "majikstar-40e60.firebaseapp.com",
  projectId: "majikstar-40e60",
  storageBucket: "majikstar-40e60.firebasestorage.app",
  messagingSenderId: "586463286912",
  appId: "1:586463286912:web:53ccdc8f59d603c095b865",
  measurementId: "G-9KMJWEKZL2",
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ DOM elements
const userTable = document.getElementById("userTable");
const searchInput = document.getElementById("searchInput");
const totalUsersEl = document.getElementById("totalUsers");
const activeUsersEl = document.getElementById("activeUsers");
const totalBalanceEl = document.getElementById("totalBalance");

let allUsers = [];

// 🔥 Listen to users collection
const usersCol = collection(db, "users");
const usersQuery = query(usersCol, orderBy("createdAt", "desc"));

onSnapshot(usersQuery, (snapshot) => {
  allUsers = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email || "",
      username: data.username || "",
      country: data.country || "",
      balance: Number(data.balance || 0),
      createdAt: data.createdAt || null,
    };
  });
  renderUsers(allUsers);
  updateStats(allUsers);
});

function renderUsers(users) {
  userTable.innerHTML = "";
  if (!users.length) {
    userTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No users found</td></tr>`;
    return;
  }

  users.forEach((user) => {
    const created = user.createdAt?.toDate
      ? user.createdAt.toDate()
      : new Date(user.createdAt || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.email} <br><small>${user.username || ""}</small></td>
      <td>${user.country || "—"}</td>
      <td>$${user.balance.toFixed(2)}</td>
      <td>${created > new Date(0) ? created.toLocaleString() : "—"}</td>
      <td>
        <button class="btn topup" data-id="${user.id}" data-balance="${
      user.balance
    }">Top Up</button>
        <button class="btn view" data-id="${user.id}">View</button>
      </td>
    `;
    userTable.appendChild(tr);
  });

  document.querySelectorAll(".btn.topup").forEach((btn) => {
    btn.onclick = () => topUp(btn.dataset.id, Number(btn.dataset.balance));
  });
  document.querySelectorAll(".btn.view").forEach((btn) => {
    btn.onclick = () => viewUser(btn.dataset.id);
  });
}

function updateStats(users) {
  totalUsersEl.textContent = users.length;
  const now = Date.now();
  const activeCount = users.filter((u) => {
    const created = u.createdAt?.toDate
      ? u.createdAt.toDate()
      : new Date(u.createdAt || 0);
    return now - created.getTime() < 72 * 60 * 60 * 1000;
  }).length;
  activeUsersEl.textContent = activeCount;
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
  totalBalanceEl.textContent = `$${totalBalance.toFixed(2)}`;
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  renderUsers(
    allUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    )
  );
});

async function topUp(userId, currentBalance) {
  const { value: amount } = await Swal.fire({
    title: "Top Up",
    input: "number",
    inputLabel: "Enter amount to add",
    inputValue: 0,
    showCancelButton: true,
  });

  if (!amount) return;
  const n = Number(amount);
  if (isNaN(n) || n <= 0) return Swal.fire("Error", "Invalid amount", "error");

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { balance: currentBalance + n });
  await addDoc(collection(db, "transactions"), {
    userId,
    type: "admin_topup",
    amount: n,
    createdAt: serverTimestamp(),
  });
  Swal.fire("Done", "Balance updated!", "success");
}

async function viewUser(id) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return Swal.fire("Error", "User not found", "error");
  const d = snap.data();
  Swal.fire({
    title: "User Details",
    html: `<b>Email:</b> ${d.email || "—"}<br>
           <b>Name:</b> ${d.username || "—"}<br>
           <b>Balance:</b> $${(d.balance || 0).toFixed(2)}<br>
           <b>Country:</b> ${d.country || "—"}`,
  });
}
