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

    if (token && role) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);

      // Redirect based on role
      if (role === "admin") {
        window.location.href = "admin/index.html"; // Admin dashboard
      } else {
        window.location.href = "index.html"; // Normal user dashboard
      }
    } else {
      alert("Login did not return a token or role.");
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
  window.location.href = "login.html";
}

// ====== AUTH GUARD ======
(function authGuard() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const path = window.location.pathname;
  const isLoginPage = path.includes("login.html");
  const isAdminPage = path.includes("admin/index.html");
  const isUserPage = path.includes("index.html") && !isAdminPage;

  // Not logged in → redirect to login
  if (!token && !isLoginPage) {
    window.location.href = "login.html";
    return;
  }

  // Logged in → redirect to correct dashboard if on login page
  if (token && isLoginPage) {
    if (role === "admin") {
      window.location.href = "admin/index.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }

  // Block non-admin from admin page
  if (isAdminPage && role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "login.html";
    return;
  }

  // Optional: redirect admin away from normal user page
  if (isUserPage && role === "admin") {
    window.location.href = "admin/index.html";
    return;
  }
})();

// ====== FETCH USERS ======
async function fetchUsers() {
  const token = localStorage.getItem("authToken");
  if (!token) return (window.location.href = "login.html");

  try {
    const res = await fetch(USERS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    users = Array.isArray(data) ? data : data.users || [];
    renderUsers();
  } catch (err) {
    console.error("Error fetching users:", err);
    alert("Could not load users from SafeTrip API.");
  }
}

// ====== FETCH SOS ALERTS ======
async function fetchSOSAlerts() {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(SOS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch SOS alerts");
    const data = await res.json();
    sosAlerts = Array.isArray(data) ? data : data.sos || [];
    renderSOSAlerts();
  } catch (err) {
    console.error("Error fetching SOS alerts:", err);
    alert("Could not load SOS alerts.");
  }
}

// ====== FETCH CHECKINS ======
async function fetchCheckins() {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(CHECKINS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch check-ins");
    const data = await res.json();
    checkins = Array.isArray(data) ? data : data.checkins || [];
    renderCheckins();
  } catch (err) {
    console.error("Error fetching check-ins:", err);
    alert("Could not load check-ins.");
  }
}

// ====== CRUD USERS ======
async function addOrEditUser(id, name, email, role) {
  const token = localStorage.getItem("authToken");
  const method = id ? "PUT" : "POST";
  const url = id ? `${USERS_URL}/${id}` : USERS_URL;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, role }),
    });
    if (!res.ok) throw new Error("Save failed");
    await fetchUsers();
    closeModal();
  } catch (err) {
    console.error("Error saving user:", err);
    alert("Failed to save user.");
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(`${USERS_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Delete failed");
    await fetchUsers();
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Failed to delete user.");
  }
}

// ====== CRUD SOS ======
async function updateSOSStatus(id, status) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${SOS_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Update failed");
    await fetchSOSAlerts();
  } catch (err) {
    console.error("Error updating SOS:", err);
    alert("Failed to update SOS alert.");
  }
}

async function deleteSOS(id) {
  if (!confirm("Delete this SOS alert?")) return;
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${SOS_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Delete failed");
    await fetchSOSAlerts();
  } catch (err) {
    console.error("Error deleting SOS:", err);
    alert("Failed to delete SOS alert.");
  }
}

// ====== CRUD CHECKINS ======
async function deleteCheckin(id) {
  if (!confirm("Delete this check-in?")) return;
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${CHECKINS_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Delete failed");
    await fetchCheckins();
  } catch (err) {
    console.error("Error deleting check-in:", err);
    alert("Failed to delete check-in.");
  }
}

// ====== RENDER FUNCTIONS ======
function renderUsers() {
  const tbody = document.querySelector("#userTable tbody");
  if (!tbody) return;
  tbody.innerHTML = users
    .map(
      (u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${u.name || "N/A"}</td>
      <td>${u.email || "N/A"}</td>
      <td>${u.role || "User"}</td>
      <td>
        <button class="btn-edit" onclick="openModal(${u.id})">Edit</button>
        <button class="btn-delete" onclick="deleteUser(${u.id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function renderSOSAlerts() {
  const tbody = document.querySelector("#sosTable tbody");
  if (!tbody) return;
  tbody.innerHTML = sosAlerts
    .map(
      (s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.user?.name || "Unknown"}</td>
      <td>${s.location || "N/A"}</td>
      <td>${new Date(s.createdAt).toLocaleString() || "-"}</td>
      <td>${s.status || "Pending"}</td>
      <td>
        <button class="btn-edit" onclick="updateSOSStatus('${
          s.id
        }', 'Resolved')">Resolve</button>
        <button class="btn-delete" onclick="deleteSOS('${
          s.id
        }')">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function renderCheckins() {
  const tbody = document.querySelector("#checkinTable tbody");
  if (!tbody) return;
  tbody.innerHTML = checkins
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.user?.name || "Unknown"}</td>
      <td>${c.location || "N/A"}</td>
      <td>${new Date(c.date).toLocaleString() || "-"}</td>
      <td>${c.notes || "-"}</td>
      <td>
        <button class="btn-delete" onclick="deleteCheckin('${
          c.id
        }')">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// ====== DASHBOARD OVERVIEW ======
async function fetchOverview() {
  const token = localStorage.getItem("authToken");
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
    console.error("Error loading overview:", err);
  }
}

// ====== SIDEBAR NAVIGATION ======
document.querySelectorAll(".sidebar nav a[data-section]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    document
      .querySelectorAll(".sidebar nav a")
      .forEach((a) => a.classList.remove("active"));
    link.classList.add("active");

    document
      .querySelectorAll(".content-section")
      .forEach((sec) => sec.classList.remove("active"));

    const sectionId = link.getAttribute("data-section");
    document.getElementById(sectionId + "Section").classList.add("active");

    const title = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    document.getElementById("sectionTitle").textContent = `${title} Overview`;

    if (sectionId === "dashboard") {
      fetchOverview();
      fetchUsers();
    } else if (sectionId === "sos") {
      fetchSOSAlerts();
    } else if (sectionId === "checkins") {
      fetchCheckins();
    }
  });
});

// ====== LOGIN FORM ======
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

// ====== INIT ======
if (window.location.pathname.includes("admin/index.html")) {
  fetchOverview();
  fetchUsers();
}
