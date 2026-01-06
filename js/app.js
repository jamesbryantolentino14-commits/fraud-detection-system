/* ===========================
   GLOBAL & ROLE HANDLING
=========================== */
function selectRole(role) {
  localStorage.setItem("role", role);
  window.location.href = "login.html";
}

function login() {
  const role = localStorage.getItem("role");
  if (role === "student") window.location.href = "student/dashboard.html";
  else if (role === "staff") window.location.href = "staff/dashboard.html";
  else window.location.href = "admin/dashboard.html";
}

function goBack() {
  window.history.back();
}

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

/* ===========================
   FILE UPLOAD & PREVIEW
=========================== */
let uploadedFile = null;

function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const allowed = ["image/png", "image/jpeg", "application/pdf"];
  if (!allowed.includes(file.type)) {
    alert("Invalid file type");
    input.value = "";
    return;
  }

  uploadedFile = file;
  showPreview(file);
}

function showPreview(file) {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  if (file.type.includes("image")) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  } else {
    preview.innerHTML = `<p>📄 ${file.name}</p>`;
  }
}

/* ===========================
   STUDENT DOCUMENT SUBMISSION
=========================== */
function submitDocument() {
  if (!uploadedFile) {
    alert("Please select a file");
    return;
  }

  const bar = document.getElementById("progressBar");
  const status = document.getElementById("statusText");
  let progress = 0;

  status.innerText = "Uploading...";
  status.className = "status-pending";

  const interval = setInterval(() => {
    progress += 10;
    bar.style.width = progress + "%";

    if (progress >= 100) {
      clearInterval(interval);
      analyzeDocument(uploadedFile);
    }
  }, 200);
}

function analyzeDocument(file) {
  const statusText = document.getElementById("statusText");
  statusText.innerText = "Analyzing document...";

  setTimeout(() => {
    const fraud = naiveBayesClassifier(file);

    const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
    submissions.push({
      student: "Student001",
      file: file.name,
      status: fraud ? "Rejected" : "Pending",
      department: "CCS",
    });

    localStorage.setItem("submissions", JSON.stringify(submissions));

    statusText.innerText = fraud
      ? "❌ Fraud detected. Rejected."
      : "⏳ Waiting for staff approval";

    statusText.className = fraud ? "status-rejected" : "status-pending";
    uploadedFile = null;
    document.getElementById("preview").innerHTML = "";
    document.getElementById("progressBar").style.width = "0%";

    // Update staff dashboard in real time if staff page is open
    updateStaffDashboard();
  }, 1500);
}

function naiveBayesClassifier(file) {
  let score = 0;
  if (file.size < 60000) score++;
  if (file.name.toLowerCase().includes("edit")) score++;
  if (file.type !== "application/pdf") score++;
  return score >= 2; // TRUE = fraud
}

/* ===========================
   STUDENT CLEARANCE REQUEST
=========================== */
function requestClearance() {
  const student = "Student001";
  const requests = JSON.parse(localStorage.getItem("registrarRequests")) || [];

  requests.push({ student, status: "Pending" });
  localStorage.setItem("registrarRequests", JSON.stringify(requests));

  alert("📨 Clearance request submitted to Registrar");
  if (document.getElementById("mainContent")) showRegistrar();
  updateStaffDashboard();
}

/* ===========================
   STUDENT DASHBOARD VIEWS
=========================== */
function showDashboard() {
  const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
  const requests = JSON.parse(localStorage.getItem("registrarRequests")) || [];
  const student = "Student001";

  const ccsStatus =
    submissions.find((s) => s.student === student)?.status || "Pending";
  const registrarStatus =
    requests.find((r) => r.student === student)?.status || "Pending";

  document.getElementById("mainContent").innerHTML = `
    <h2>Clearance Status</h2>
    <div class="status green">Library - Cleared</div>
    <div class="status ${
      ccsStatus === "Approved"
        ? "green"
        : ccsStatus === "Rejected"
        ? "red"
        : "yellow"
    }">CCS - ${ccsStatus}</div>
    <div class="status ${
      registrarStatus === "Approved"
        ? "green"
        : registrarStatus === "Rejected"
        ? "red"
        : "yellow"
    }">Registrar - ${registrarStatus}</div>
    <div class="status red">Cashier - Blocked</div>
    <div class="info">
      🔒 Fraud Detection Active <br>
      All documents are monitored for authenticity.
    </div>
  `;
}

function showLibrary() {
  document.getElementById("mainContent").innerHTML = `
    <h2>Library Clearance</h2>
    <p>Status: <b>✔ No pending borrowed books</b></p>
  `;
}

function showCCS() {
  document.getElementById("mainContent").innerHTML = `
    <h2>CCS Document Submission</h2>
    <input type="file" accept=".png,.jpg,.jpeg,.pdf" onchange="handleFileUpload(this)">
    <div id="preview"></div>
    <div class="progress-container"><div id="progressBar"></div></div>
    <button onclick="submitDocument()">Submit</button>
    <p id="statusText"></p>
  `;
}

function showRegistrar() {
  document.getElementById("mainContent").innerHTML = `
    <h2>Registrar Clearance</h2>
    <p>Please complete all department requirements.</p>
    <button onclick="requestClearance()">Request Clearance</button>
  `;
}

function showCashier() {
  document.getElementById("mainContent").innerHTML = `
    <h2>Cashier Payment</h2>
    <input type="file" accept=".png,.jpg,.jpeg,.pdf" onchange="handleFileUpload(this)">
    <div id="preview"></div>
    <div class="progress-container"><div id="progressBar"></div></div>
    <button onclick="submitDocument()">Submit Receipt</button>
    <p id="statusText"></p>
  `;
}

/* ===========================
   STAFF DASHBOARD & APPROVAL
=========================== */
function updateStaffDashboard() {
  const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
  const requests = JSON.parse(localStorage.getItem("registrarRequests")) || [];

  let html = "<h3>Staff Dashboard</h3>";

  if (submissions.length > 0) {
    html += "<h4>Document Submissions</h4>";
    submissions.forEach((s, i) => {
      html += `
        <p>
          ${s.student} – ${s.file} – <b>${s.status}</b>
          ${s.status === "Pending" ? `
            <button onclick="approveSubmission(${i})">Approve</button>
            <button onclick="rejectSubmission(${i})">Reject</button>
          ` : ""}
        </p>
      `;
    });
  }

  if (requests.length > 0) {
    html += "<h4>Registrar Requests</h4>";
    requests.forEach((r, i) => {
      html += `
        <p>
          ${r.student} – <b>${r.status}</b>
          ${r.status === "Pending" ? `
            <button onclick="approveRequest(${i})">Approve</button>
            <button onclick="rejectRequest(${i})">Reject</button>
          ` : ""}
        </p>
      `;
    });
  }

  if (document.getElementById("content"))
    document.getElementById("content").innerHTML = html;
}

/* ===========================
   STAFF APPROVE / REJECT FUNCTIONS
=========================== */
function approveSubmission(index) {
  const submissions = JSON.parse(localStorage.getItem("submissions"));
  submissions[index].status = "Approved";
  localStorage.setItem("submissions", JSON.stringify(submissions));
  updateStaffDashboard();
}

function rejectSubmission(index) {
  const submissions = JSON.parse(localStorage.getItem("submissions"));
  submissions[index].status = "Rejected";
  localStorage.setItem("submissions", JSON.stringify(submissions));
  updateStaffDashboard();
}

function approveRequest(index) {
  const requests = JSON.parse(localStorage.getItem("registrarRequests"));
  requests[index].status = "Approved";
  localStorage.setItem("registrarRequests", JSON.stringify(requests));
  updateStaffDashboard();
}

function rejectRequest(index) {
  const requests = JSON.parse(localStorage.getItem("registrarRequests"));
  requests[index].status = "Rejected";
  localStorage.setItem("registrarRequests", JSON.stringify(requests));
  updateStaffDashboard();
}
function approveRegistrar(index){
  const requests = JSON.parse(localStorage.getItem("registrarRequests")) || [];
  requests[index].status = "Approved";
  localStorage.setItem("registrarRequests", JSON.stringify(requests));
  alert("Approved");
}

function rejectRegistrar(index){
  const requests = JSON.parse(localStorage.getItem("registrarRequests")) || [];
  requests[index].status = "Rejected";
  localStorage.setItem("registrarRequests", JSON.stringify(requests));
  alert("Rejected");
}
/* =========================
   ADMIN DASHBOARD
========================= */
function showAdminDashboard(){
  const students=JSON.parse(localStorage.getItem("students"))||[];
  let html="<h3>Admin Dashboard</h3>";

  if(students.length>0){
    students.forEach((s,i)=>{
      const ccsStatus = s.submissions.length ? s.submissions[s.submissions.length-1].status : "Pending";
      const regStatus = s.registrarRequests.length ? s.registrarRequests[s.registrarRequests.length-1].status : "Pending";

      html += `
        <p>
          ${s.name} (${s.yearSection})
          <span class="profile-icon" onclick="showAdminModal(${i})">👤</span>
          <b>CCS:</b> ${ccsStatus}, <b>Registrar:</b> ${regStatus}
          ${ccsStatus==="Rejected"||regStatus==="Rejected" ? `<span style="color:red;">⚠ Issue detected</span>` : ""}
        </p>
      `;
    });
  } else html+="<p>No students registered</p>";

  if(document.getElementById("adminContent"))
    document.getElementById("adminContent").innerHTML = html;
}

/* =========================
   ADMIN MODAL VIEW
========================= */
function showAdminModal(index){
  const students=JSON.parse(localStorage.getItem("students"))||[];
  const s=students[index];
  const ccsStatus = s.submissions.length ? s.submissions[s.submissions.length-1].status : "Pending";
  const regStatus = s.registrarRequests.length ? s.registrarRequests[s.registrarRequests.length-1].status : "Pending";

  document.getElementById("aName").innerText=s.name;
  document.getElementById("aAge").innerText=s.age;
  document.getElementById("aNumber").innerText=s.studentNumber;
  document.getElementById("aCourse").innerText=s.course;
  document.getElementById("aYear").innerText=s.yearSection;
  document.getElementById("aCCS").innerText=ccsStatus;
  document.getElementById("aRegistrar").innerText=regStatus;

  document.getElementById("adminOverlay").style.display="block";
  document.getElementById("adminModal").style.display="block";
}

function hideAdminModal(){
  document.getElementById("adminOverlay").style.display="none";
  document.getElementById("adminModal").style.display="none";
}
/* =========================
   ADMIN LIVE DASHBOARD REFRESH
========================= */
function updateAdminDashboard() {
  const students = JSON.parse(localStorage.getItem("students")) || [];

  let html = "<h3>Admin Dashboard</h3>";

  if (students.length > 0) {
    students.forEach((s, i) => {
      const ccsStatus = s.submissions.length ? s.submissions[s.submissions.length - 1].status : "Pending";
      const regStatus = s.registrarRequests.length ? s.registrarRequests[s.registrarRequests.length - 1].status : "Pending";

      html += `
        <p>
          ${s.name} (${s.yearSection})
          <span class="profile-icon" onclick="showAdminModal(${i})">👤</span>
          <b>CCS:</b> ${ccsStatus}, <b>Registrar:</b> ${regStatus}
          ${ccsStatus === "Rejected" || regStatus === "Rejected" ? `<span style="color:red;">⚠ Issue detected</span>` : ""}
        </p>
      `;
    });
  } else html += "<p>No students registered</p>";

  if (document.getElementById("adminContent"))
    document.getElementById("adminContent").innerHTML = html;
}

// Auto-refresh admin dashboard every 2 seconds
setInterval(() => {
  if (window.location.pathname.includes("admin/dashboard.html")) {
    updateAdminDashboard();
  }
}, 2000);
/* =========================
   INITIALIZE STUDENTS
========================= */
if (!localStorage.getItem("students")) {
  localStorage.setItem("students", JSON.stringify([
    {
      name: "James Bryan B. Tolentino",
      age: 21,
      studentNumber: "2026-001",
      course: "BSCS",
      yearSection: "3-IS",
      submissions: [],
      registrarRequests: []
    },
    {
      name: "Shane A. Florentino",
      age: 22,
      studentNumber: "2026-002",
      course: "BSCS",
      yearSection: "3-IS",
      submissions: [],
      registrarRequests: []
    },
    {
      name: "Jericho Peregrina",
      age: 21,
      studentNumber: "2026-003",
      course: "BSCS",
      yearSection: "3-IS",
      submissions: [],
      registrarRequests: []
    }
  ]));
}
function submitDocument() {
  if (!uploadedFile) { alert("Please select a file"); return; }

  const bar = document.getElementById("progressBar");
  const status = document.getElementById("statusText");
  let progress = 0;

  status.innerText = "Uploading...";
  status.className = "status-pending";

  const interval = setInterval(() => {
    progress += 10;
    bar.style.width = progress + "%";

    if (progress >= 100) {
      clearInterval(interval);

      const students = JSON.parse(localStorage.getItem("students")) || [];
      const student = students.find(s => s.name === "James Bryan B. Tolentino"); // Replace with logged-in student

      const fraud = naiveBayesClassifier(uploadedFile);

      student.submissions.push({
        file: uploadedFile.name,
        status: fraud ? "Rejected" : "Pending",
        department: "CCS"
      });

      localStorage.setItem("students", JSON.stringify(students));

      status.innerText = fraud ? "❌ Fraud detected. Rejected." : "⏳ Waiting for staff approval";
      status.className = fraud ? "status-rejected" : "status-pending";
      uploadedFile = null;
      document.getElementById("preview").innerHTML = "";
      document.getElementById("progressBar").style.width = "0%";

      // Update dashboards
      updateStaffDashboard();
      updateAdminDashboard();
    }
  }, 200);
}

function requestClearance() {
  const students = JSON.parse(localStorage.getItem("students")) || [];
  const student = students.find(s => s.name === "James Bryan B. Tolentino"); // Replace with logged-in student

  student.registrarRequests.push({ status: "Pending" });
  localStorage.setItem("students", JSON.stringify(students));

  alert("📨 Clearance request submitted to Registrar");

  showRegistrar();
  updateStaffDashboard();
  updateAdminDashboard();
}
/* ===========================
   GLOBAL DATA
=========================== */
const students = [
  {
    name: "James Bryan B. Tolentino",
    age: 21,
    studentNumber: "2023-001",
    course: "BSCS 3-IS"
  },
  {
    name: "Shane A. Florentino",
    age: 21,
    studentNumber: "2023-002",
    course: "BSCS 3-IS"
  },
  {
    name: "Jericho Peregrina",
    age: 22,
    studentNumber: "2023-003",
    course: "BSCS 3-IS"
  }
];

/* ===========================
   ROLE HANDLING
=========================== */
function selectRole(role) {
  localStorage.setItem("role", role);
  window.location.href = "login.html";
}

function login() {
  const role = localStorage.getItem("role");

  if (role === "student") {
    localStorage.setItem("studentInfo", JSON.stringify(students[0]));
    window.location.href = "student/dashboard.html";
  }
  else if (role === "staff") {
    window.location.href = "staff/dashboard.html";
  }
  else {
    window.location.href = "admin/dashboard.html";
  }
}

function selectDepartment(dept) {
  localStorage.setItem("department", dept);
  window.location.href = dept.toLowerCase() + ".html";
}

function goBack() {
  window.history.back();
}

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

/* ===========================
   STAFF DASHBOARD LOGIC
=========================== */
function loadDepartmentDashboard(dept) {
  const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
  const container = document.getElementById("staffContent");

  let html = "";

  students.forEach((s, i) => {
    const record = submissions.find(
      x => x.student === s.name && x.department === dept
    );

    const status = record ? record.status : "Pending";

    html += `
      <div class="card">
        <b>${s.name}</b><br>
        ${s.studentNumber}<br>
        Status: <b>${status}</b><br>
        ${
          status === "Pending"
          ? `<button onclick="approveDept('${dept}','${s.name}')">Approve</button>
             <button onclick="rejectDept('${dept}','${s.name}')">Reject</button>`
          : ""
        }
      </div>
    `;
  });

  container.innerHTML = html;
}

function approveDept(dept, student) {
  updateSubmission(dept, student, "Approved");
}

function rejectDept(dept, student) {
  updateSubmission(dept, student, "Rejected");
}

function updateSubmission(dept, student, status) {
  let submissions = JSON.parse(localStorage.getItem("submissions")) || [];

  const index = submissions.findIndex(
    s => s.student === student && s.department === dept
  );

  if (index >= 0) {
    submissions[index].status = status;
  } else {
    submissions.push({
      student,
      department: dept,
      status
    });
  }

  localStorage.setItem("submissions", JSON.stringify(submissions));
  loadDepartmentDashboard(dept);
}

/* ===========================
   SEARCH
=========================== */
function filterStudents(dept) {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(input)
      ? ""
      : "none";
  });
}

/* ===========================
   ADMIN DASHBOARD
=========================== */
function loadAdminDashboard() {
  const submissions = JSON.parse(localStorage.getItem("submissions")) || [];
  let html = "<h3>All Records</h3>";

  submissions.forEach(s => {
    html += `<p>${s.student} | ${s.department} | ${s.status}</p>`;
  });

  document.getElementById("adminContent").innerHTML = html;
}