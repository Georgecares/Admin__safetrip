// ====== CONFIG ======
const API_URL = "https://safetrip-backend-v3.onrender.com";
const LOGIN_URL = `${API_URL}/api/auth/login`;
const LOGOUT_URL = `${API_URL}/api/auth/logout`;
const USERS_URL = `${API_URL}/api/admin/users`;
const OVERVIEW_URL = `${API_URL}/api/admin/overview`;
const SOS_URL = `${API_URL}/api/admin/sos`;
const CHECKINS_URL = `${API_URL}/api/admin/checkins`;

let users = [];
let sosAlerts = [];
let checkins = [];

// ====== AUTH ======
async function loginAdmin(email, password) {
  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    const token = data?.data?.token;
    const role = data?.data?.role;

    if (token && role === "admin") {
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "admin/index.html";
    } else {
      alert("You are not authorized to access the admin dashboard.");
    }
  } catch (err) {
    console.error(err);
    alert("Login failed. Check credentials or server status.");
  }
}

async function logoutAdmin() {
  const token = localStorage.getItem("authToken");
  try {
    await fetch(LOGOUT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn("Logout API call failed but proceeding.");
  }
  localStorage.clear();
  window.location.href = "../login.html";
}

// ====== AUTH GUARD ======
const token = localStorage.getItem("authToken");
const role = localStorage.getItem("userRole");

// Redirect unauthorized access
if (
  window.location.pathname.includes("admin/") &&
  (!token || role !== "admin")
) {
  alert("Access denied. Admins only.");
  window.location.href = "../login.html";
}

// Redirect logged-in admin away from login page
if (
  window.location.pathname.endsWith("login.html") &&
  token &&
  role === "admin"
) {
  window.location.href = "admin/index.html";
}

// ====== LOGIN FORM HANDLER ======
const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  loginAdmin(email, password);
});

// ====== LOGOUT ======
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", logoutAdmin);

// ====== THEME TOGGLE ======
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-mode");
  themeToggle.innerHTML = '<i class="material-icons">dark_mode</i>';
}
themeToggle?.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark
    ? `<i class="material-icons">wb_sunny</i>`
    : `<i class="material-icons">dark_mode</i>`;
});

// ====== FETCH FUNCTIONS ======
async function fetchUsers() {
  if (!token) return (window.location.href = "../login.html");
  try {
    const res = await fetch(USERS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    users = Array.isArray(data) ? data : data.users || [];
    renderUsers();
  } catch (err) {
    console.error(err);
    alert("Could not load users.");
  }
}

async function fetchSOSAlerts() {
  if (!token) return;
  try {
    const res = await fetch(SOS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch SOS alerts");
    const data = await res.json();
    sosAlerts = Array.isArray(data) ? data : data.sos || [];
    renderSOSAlerts();
  } catch (err) {
    console.error(err);
    alert("Could not load SOS alerts.");
  }
}

async function fetchCheckins() {
  if (!token) return;
  try {
    const res = await fetch(CHECKINS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch check-ins");
    const data = await res.json();
    checkins = Array.isArray(data) ? data : data.checkins || [];
    renderCheckins();
  } catch (err) {
    console.error(err);
    alert("Could not load check-ins.");
  }
}

async function fetchOverview() {
  if (!token) return;
  try {
    const res = await fetch(OVERVIEW_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch overview");
    const data = await res.json();
    document.getElementById("userCount").textContent = data.totalUsers ?? "-";
    document.getElementById("sosCount").textContent = data.totalSOS ?? "-";
    document.getElementById("checkinCount").textContent =
      data.totalCheckins ?? "-";
  } catch (err) {
    console.error(err);
  }
}

// ====== INIT DASHBOARD ======
if (window.location.pathname.includes("admin/index.html")) {
  fetchOverview();
  fetchUsers();
}
