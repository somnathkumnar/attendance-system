(function () {

// ✅ CONFIG
const SHAREPOINT_SITE = "https://saintgobain.sharepoint.com/sites/Test530";
const TRAINER_LIST = "TrainerEmails";
const OTP_LIST = "TrainerOTP";

// ========== UTILITY FUNCTIONS ==========

// ✅ Reusable SharePoint POST utility
async function spPost(listName, item) {
    const url = `${SHAREPOINT_SITE}/_api/web/lists/GetByTitle('${listName}')/items`;
    return fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose"
        },
        body: JSON.stringify({
            "__metadata": { "type": `SP.Data.${listName}ListItem` },
            ...item
        })
    }).then(r => r.json());
}

// ✅ Reusable SharePoint GET filter query
async function spGetFilter(listName, filter) {
    const url = `${SHAREPOINT_SITE}/_api/web/lists/GetByTitle('${listName}')/items?$filter=${filter}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json;odata=verbose"
        }
    });
    const data = await response.json();
    return data.d.results;
}

// ========== MAIN UI CREATION ==========

document.addEventListener("DOMContentLoaded", function () {

    document.body.innerHTML = `
    <style>
    body { font-family: Arial; background:#f5f5f5; padding:20px; }
    #box {
      max-width:450px; margin:auto; background:#fff; padding:20px;
      box-shadow:0 0 10px #ccc; border-radius:10px;
    }
    input,button { width:100%; padding:10px; margin-top:10px; }
    button { background:#0078D4; color:white; border:none; font-weight:bold; cursor:pointer; }
    #trainerPanel { display:none; }
    #otpSection { display:none; }
    #msg { margin-top:15px; color:green; font-weight:bold; }
    #error { margin-top:15px; color:red; font-weight:bold; }
    </style>

    <div id="box">
        <h2 style="text-align:center;">Online Attendance</h2>

        <!-- TRAINER LOGIN SECTION -->
        <h3>Trainer Login</h3>
        <input id="trainerEmail" placeholder="Enter Trainer Email">
        <button id="getOtpBtn">Get OTP</button>

        <div id="otpSection">
            <input id="trainerOtp" placeholder="Enter OTP">
            <button id="verifyOtpBtn">Verify OTP</button>
        </div>

        <p id="error"></p>
        <p id="msg"></p>

        <!-- TRAINER PANEL -->
        <div id="trainerPanel">
            <h3>Trainer Panel</h3>
            <input id="trainingName" placeholder="Training Name">
            <button id="newSessionBtn">New Session</button>
            <p><b>Session ID:</b> <span id="sessionID"></span></p>
        </div>

        <!-- ATTENDANCE SECTION -->
        <h3>Mark Attendance</h3>
        <input id="empID" placeholder="Employee ID">
        <input id="empName" placeholder="Employee Name">
        <button id="submitBtn">Submit Attendance</button>

        <p id="attendanceMsg"></p>
    </div>
    `;

    document.getElementById("getOtpBtn").onclick = handleTrainerOtpRequest;
    document.getElementById("verifyOtpBtn").onclick = verifyTrainerOtp;
    document.getElementById("newSessionBtn").onclick = newSession;
    document.getElementById("submitBtn").onclick = submitAttendance;

    newSession(); // Initialize Session ID
});

// ========== TRAINER OTP LOGIN LOGIC ==========

// ✅ Step 1 — Validate Trainer Email
async function handleTrainerOtpRequest() {
    document.getElementById("error").innerText = "";
    const email = document.getElementById("trainerEmail").value.trim().toLowerCase();

    if (!email) {
        document.getElementById("error").innerText = "Please enter trainer email.";
        return;
    }

    // ✅ Check if email exists in TrainerEmails list
    const trainer = await spGetFilter(TRAINER_LIST, `Email eq '${email}'`);
    if (trainer.length === 0) {
        document.getElementById("error").innerText = "Unauthorized trainer email.";
        return;
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60000).toISOString(); // +5 minutes

    // ✅ Save OTP in SharePoint list
    await spPost(OTP_LIST, {
        Email: email,
        OTP: otp,
        ExpiryTime: expiry,
        Used: false
    });

    // ✅ Show OTP on screen
    document.getElementById("msg").innerText = "Your OTP is: " + otp;
    document.getElementById("otpSection").style.display = "block";
}

// ✅ Step 2 — Verify OTP
async function verifyTrainerOtp() {
    document.getElementById("error").innerText = "";
    const email = document.getElementById("trainerEmail").value.trim().toLowerCase();
    const otpInput = document.getElementById("trainerOtp").value.trim();

    const results = await spGetFilter(OTP_LIST, `Email eq '${email}' and OTP eq '${otpInput}'`);

    if (results.length === 0) {
        document.getElementById("error").innerText = "Invalid OTP.";
        return;
    }

    const otpEntry = results[0];
    const now = new Date();

    if (new Date(otpEntry.ExpiryTime) < now) {
        document.getElementById("error").innerText = "OTP expired. Request a new one.";
        return;
    }

    // ✅ Mark OTP as used (optional)
    document.getElementById("trainerPanel").style.display = "block";
    document.getElementById("msg").innerText = "Trainer Verified ✅";
}

// ========== TRAINER PANEL FUNCTIONS ==========

function generateSessionID() {
    return "S_" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function newSession() {
    document.getElementById("sessionID").innerText = generateSessionID();
}

// ========== ATTENDANCE LOGIC ==========
async function submitAttendance() {
    const id = document.getElementById("empID").value.trim();
    const name = document.getElementById("empName").value.trim();
    const training = document.getElementById("trainingName").value.trim() || "Training";
    const session = document.getElementById("sessionID").innerText;

    if (!id || !name) {
        document.getElementById("attendanceMsg").innerText = "Please enter all fields.";
        return;
    }

    const geo = await getLocation();

    // ✅ Save attendance to default Training_Attendance list
    await spPost("Training_Attendance", {
        EmployeeID: id,
        EmployeeName: name,
        TrainingName: training,
        SessionID: session,
        Latitude: geo.lat,
        Longitude: geo.lon,
        TrainerLogin: "Participant",
        Timestamp: new Date().toISOString()
    });

    document.getElementById("attendanceMsg").innerText = "Attendance Submitted ✅";

    document.getElementById("empID").value = "";
    document.getElementById("empName").value = "";
}

// ✅ GPS
function getLocation() {
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat: null, lon: null })
        );
    });
}

})();
