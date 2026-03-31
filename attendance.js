(function () {

const SHAREPOINT_SITE = "https://saintgobain.sharepoint.com/sites/Test530";
const LIST_NAME = "Training_Attendance";
const TRAINER_PASSWORD = "SG_Trainer_2024!";

document.addEventListener("DOMContentLoaded", function () {

  document.body.innerHTML = `
  <style>
    body { font-family: Arial; background:#f5f5f5; padding:20px; }
    #attBox {
      max-width:450px; margin:auto; background:#fff; padding:20px;
      box-shadow:0 0 10px #ccc; border-radius:10px;
    }
    input,button { width:100%; padding:10px; margin-top:10px; }
    button { background:#0078D4; color:white; border:none; font-weight:bold; }
    #trainerPanel { display:none; }
    #msg { margin-top:15px; color:green; font-weight:bold; }
  </style>

  <div id="attBox">
    <h2 style="text-align:center;">Online Attendance</h2>

    <div id="trainerGate">
      <h3>Trainer Access</h3>
      <input type="password" id="trainerPassword" placeholder="Trainer Password">
      <button id="unlockBtn">Unlock</button>
    </div>

    <div id="trainerPanel">
      <h3>Trainer Panel</h3>
      <input id="trainingName" placeholder="Training Name">
      <button id="newSessionBtn">New Session</button>
      <p><b>Session ID:</b> <span id="sessionID"></span></p>
    </div>

    <h3>Mark Attendance</h3>
    <input id="empID" placeholder="Employee ID">
    <input id="empName" placeholder="Employee Name">
    <button id="submitBtn">Submit Attendance</button>

    <p id="msg"></p>
  </div>
  `;

  const sessionSpan = document.getElementById("sessionID");
  sessionSpan.textContent = generateSessionID();

  document.getElementById("unlockBtn").onclick = unlockTrainer;
  document.getElementById("newSessionBtn").onclick = newSession;
  document.getElementById("submitBtn").onclick = submitAttendance;
});

function generateSessionID() {
  return "S_" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function unlockTrainer() {
  const pw = document.getElementById("trainerPassword").value;
  if (pw === TRAINER_PASSWORD) {
    document.getElementById("trainerPanel").style.display = "block";
    alert("Trainer unlocked");
  } else {
    alert("Incorrect password");
  }
}

function newSession() {
  document.getElementById("sessionID").textContent = generateSessionID();
}

async function submitAttendance() {
  const id = document.getElementById("empID").value.trim();
  const name = document.getElementById("empName").value.trim();
  const training = document.getElementById("trainingName").value.trim() || "Training";
  const session = document.getElementById("sessionID").textContent;

  if (!id || !name) {
    alert("Enter Employee ID and Name");
    return;
  }

  const geo = await getLocation();

  await fetch(`${SHAREPOINT_SITE}/_api/web/lists/GetByTitle('${LIST_NAME}')/items`, {
    method: "POST",
    headers: {
      "Accept": "application/json;odata=verbose",
      "Content-Type": "application/json;odata=verbose"
    },
    body: JSON.stringify({
      __metadata: { type: `SP.Data.${LIST_NAME}ListItem` },
      EmployeeID: id,
      EmployeeName: name,
      TrainingName: training,
      SessionID: session,
      Latitude: geo.lat,
      Longitude: geo.lon,
      TrainerLogin: "Participant",
      Timestamp: new Date().toISOString()
    })
  });

  document.getElementById("msg").textContent = "Attendance Submitted!";
}

function getLocation() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: null, lon: null })
    );
  });
}

})();
