(function(){

/* CONFIG */
const SHAREPOINT_SITE = "https://saintgobain.sharepoint.com/sites/Test530";
const LIST_NAME = "Training_Attendance";
const TRAINER_PASSWORD = "SG_Trainer_2024!";

/* Inject UI */
document.write(`
<style>
body { font-family: Arial; background:#f5f5f5; padding:20px; }
#attBox {
  max-width:450px; margin:auto; background:#fff; padding:20px;
  box-shadow:0 0 10px #ccc; border-radius:10px;
}
input,button { width:100%; padding:10px; margin-top:10px; border-radius:6px; }
button { background:#0078D4; color:white; border:none; font-weight:bold; cursor:pointer; }
#trainerPanel { display:none; }
#msg { margin-top:15px; color:green; font-weight:bold; }
</style>

<div id="attBox">
<h2 style="text-align:center;">Online Attendance</h2>

<div id="trainerGate">
    <h3>Trainer Access</h3>
    <input type="password" id="trainerPassword" placeholder="Trainer Password">
    <button onclick="unlockTrainer()">Unlock</button>
</div>

<div id="trainerPanel">
    <h3>Trainer Panel</h3>
    <input id="trainingName" placeholder="Training Name">
    <button onclick="newSession()">New Session</button>
    <p><b>Session ID:</b> <span id="sessionID"></span></p>
</div>

<h3>Mark Attendance</h3>
<input id="empID" placeholder="Employee ID">
<input id="empName" placeholder="Employee Name">
<button onclick="submitAttendance()">Submit Attendance</button>

<p id="msg"></p>
</div>
`);

/* Session Generator */
function generateSessionID(){
    return "S_" + Math.random().toString(36).substring(2,10).toUpperCase();
}

document.addEventListener("DOMContentLoaded",()=>{
    let sid = document.getElementById("sessionID");
    if(sid){ sid.innerText = generateSessionID(); }
});

/* Trainer Unlock */
window.unlockTrainer = function(){
    let pw = document.getElementById("trainerPassword").value;
    if(pw === TRAINER_PASSWORD){
        document.getElementById("trainerPanel").style.display = "block";
        alert("Trainer panel unlocked.");
    } else {
        alert("Incorrect password.");
    }
};

/* New Session */
window.newSession = function(){
    document.getElementById("sessionID").innerText = generateSessionID();
    alert("New session started.");
};

/* Submit Attendance */
window.submitAttendance = async function(){
    let id = document.getElementById("empID").value.trim();
    let name = document.getElementById("empName").value.trim();
    let training = document.getElementById("trainingName").value.trim() || "Training";
    let session = document.getElementById("sessionID").innerText;

    if(!id || !name){
        alert("Enter Employee ID and Name");
        return;
    }

    let geo = await getLocation();

    saveToSharePoint({
        EmployeeID:id,
        EmployeeName:name,
        TrainingName:training,
        SessionID:session,
        Latitude:geo.lat,
        Longitude:geo.lon,
        TrainerLogin:"Participant"
    });

    document.getElementById("msg").innerText = "Attendance Submitted!";
    document.getElementById("empID").value="";
    document.getElementById("empName").value="";
};

/* Get GPS */
function getLocation(){
    return new Promise(resolve=>{
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat:pos.coords.latitude, lon:pos.coords.longitude }),
            ()  => resolve({ lat:null, lon:null })
        );
    });
}

/* Save to SharePoint List */
async function saveToSharePoint(data){
    const url = `${SHAREPOINT_SITE}/_api/web/lists/GetByTitle('${LIST_NAME}')/items`;
    const payload = {
        __metadata:{ type:`SP.Data.${LIST_NAME}ListItem` },
        EmployeeID:data.EmployeeID,
        EmployeeName:data.EmployeeName,
        TrainingName:data.TrainingName,
        SessionID:data.SessionID,
        Latitude:data.Latitude,
        Longitude:data.Longitude,
        TrainerLogin:data.TrainerLogin,
        Timestamp: new Date().toISOString()
    };

    await fetch(url, {
        method:"POST",
        headers:{
            "Accept":"application/json;odata=verbose",
            "Content-Type":"application/json;odata=verbose"
        },
        body: JSON.stringify(payload)
    });
}

})();