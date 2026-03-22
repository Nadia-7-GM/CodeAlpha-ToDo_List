let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let notifications = [];
let currentSort = "default";
let currentTaskIndex = null;

/* SAVE */
function save(){
localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* TAB */
function showTab(id){
document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
document.getElementById(id).classList.remove("hidden");
}

/* ADD TASK */
function addTask(){
let title = taskInput.value.trim();
let date = taskDate.value;
let reminder = taskReminder.value;
let repeat = taskRepeat.value;

if(!title) return;

tasks.push({
id: Date.now(),
title,
date,
reminder,
repeat,
tone: "default",
important:false,
completed:false,
steps:[],
category:"",
files:[]
});

notifications.push("Added: " + title);

taskInput.value="";
taskDate.value="";
taskReminder.value="";
taskRepeat.value="";

save();
render();
}

/* TOGGLE */
function toggle(i){
tasks[i].completed=!tasks[i].completed;
save();
render();
}

/* IMPORTANT */
function markImportant(i){
tasks[i].important=!tasks[i].important;
save();
render();
}

/* DELETE */
function del(i){
notifications.push("Deleted: " + tasks[i].title);
tasks.splice(i,1);
save();
render();
}

/* SORT */
function getSortedTasks(){
let sorted=[...tasks];

if(currentSort==="az"){
sorted.sort((a,b)=>a.title.localeCompare(b.title));
}

if(currentSort==="date"){
sorted.sort((a,b)=>{
if(!a.date) return 1;
if(!b.date) return -1;
return new Date(a.date)-new Date(b.date);
});
}

return sorted;
}

/* OPEN EDITOR */
function openEditor(i){
currentTaskIndex = i;
let t = tasks[i];

editTitle.value = t.title;
editDate.value = t.date || "";
editReminder.value = t.reminder || "";
editRepeat.value = t.repeat || "";
editTone.value = t.tone || "default";

renderSteps();

taskEditor.classList.add("active");
}

/* CLOSE EDITOR */
function closeEditor(){
taskEditor.classList.remove("active");
}

/* CATEGORY */
function setCategory(color){
tasks[currentTaskIndex].category = color;
save();
render();
}

/* SAVE EDIT */
function saveEdit(){

let t = tasks[currentTaskIndex];

t.title = editTitle.value;
t.date = editDate.value;
t.reminder = editReminder.value;
t.repeat = editRepeat.value;
t.tone = editTone.value;

let file = fileInput.files[0];
if(file) t.files.push(file.name);

save();
render();
closeEditor();
}

/* ---------- STEPS SYSTEM ---------- */

/* RENDER STEPS */
function renderSteps(){

let stepsDiv = document.getElementById("stepsList");
stepsDiv.innerHTML = "";

let t = tasks[currentTaskIndex];

t.steps.forEach((s, i)=>{
stepsDiv.innerHTML += `
<div class="step">
<div class="step-left">
<input type="checkbox" ${s.done ? "checked":""} onclick="toggleStep(${i})">
<span>${s.text}</span>
</div>
<button onclick="deleteStep(${i})">X</button>
</div>
`;
});
}

/* ADD STEP */
function addStep(){
let val = stepInput.value.trim();
if(!val) return;

tasks[currentTaskIndex].steps.push({
text: val,
done:false
});

stepInput.value="";
save();
renderSteps();
}

/* TOGGLE STEP */
function toggleStep(i){
tasks[currentTaskIndex].steps[i].done = !tasks[currentTaskIndex].steps[i].done;
save();
renderSteps();
}

/* DELETE STEP */
function deleteStep(i){
tasks[currentTaskIndex].steps.splice(i,1);
save();
renderSteps();
}

/* ---------- RENDER ---------- */

function render(){

let list=taskList;
let imp=importantList;
let plan=plannedList;
let todayDiv=todayList;
let upcomingDiv=upcomingList;
let notif=notifList;

list.innerHTML="";
imp.innerHTML="";
plan.innerHTML="";
todayDiv.innerHTML="";
upcomingDiv.innerHTML="";
notif.innerHTML="";

let today=new Date().toISOString().split("T")[0];

getSortedTasks().forEach(t=>{

let i = tasks.findIndex(task => task.id === t.id);

/* COLORS */
let borderColor="transparent";
if(t.important) borderColor="gold";
if(t.date && t.date < today) borderColor="red";

const colors = {
  blue: "#dbeafe",
  green: "#dcfce7",
  red: "#fee2e2",
   orange: "#f1d8b7"
};

let bgColor = colors[t.category] || "transparent";
/* TASK UI */
let html=`
<div class="task" style="background:${bgColor}; border-left:5px solid ${borderColor}" onclick="openEditor(${i})">
<div>
<input type="checkbox" ${t.completed?"checked":""} onclick="event.stopPropagation(); toggle(${i})">
${t.title}
<span onclick="event.stopPropagation(); markImportant(${i})">${t.important?"⭐":"☆"}</span>
${t.date?`📅 ${t.date}`:""}
</div>
<button onclick="event.stopPropagation(); del(${i})">X</button>
</div>
`;

list.innerHTML+=html;

if(t.important) imp.innerHTML+=html;
if(t.date) plan.innerHTML+=html;
if(t.date===today) todayDiv.innerHTML+=html;
if(t.date && t.date>today) upcomingDiv.innerHTML+=html;

/* REMINDER + TONE */
if(t.reminder && t.date){

let now = new Date();
let taskTime = new Date(t.date + "T" + t.reminder);

if(t.reminder && t.date && !t.notified){

let now = new Date();
let taskTime = new Date(t.date + "T" + t.reminder);

if(taskTime > now){

setTimeout(()=>{

t.notified = true;
save();

let audio;

if(t.tone === "beep"){
audio = new Audio("https://www.soundjay.com/buttons/beep-07.wav");
}
else if(t.tone === "bell"){
audio = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.wav");
}

if(audio){
audio.play().catch(()=> alert("Reminder: " + t.title));
}else{
alert("Reminder: " + t.title);
}

}, taskTime - now);

}
}
}

});

/* NOTIFICATIONS */
notifications.forEach(n=>{
notif.innerHTML+=`<li>${n}</li>`;
});
}

/* TIMER */
let stopwatchTime = 0;
let stopwatchInterval = null;

/* FORMAT TIME */
function formatTime(ms){
let totalSeconds = Math.floor(ms / 1000);
let minutes = Math.floor(totalSeconds / 60);
let seconds = totalSeconds % 60;
let milliseconds = Math.floor((ms % 1000) / 10);

return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}:${String(milliseconds).padStart(2,'0')}`;
}

/* START */
function startStopwatch(){

if(stopwatchInterval) return;

let startTime = Date.now() - stopwatchTime;

stopwatchInterval = setInterval(()=>{
stopwatchTime = Date.now() - startTime;
stopwatch.innerText = formatTime(stopwatchTime);
}, 10);

}

/* STOP */
function stopStopwatch(){
clearInterval(stopwatchInterval);
stopwatchInterval = null;
}

/* RESET */
function resetStopwatch(){
stopwatchTime = 0;
stopwatch.innerText = "00:00:00";
clearInterval(stopwatchInterval);
stopwatchInterval = null;
}

/* STOPWATCH */
let sw=0,interval;

function startStopwatch(){
interval=setInterval(()=>{
sw++;
stopwatch.innerText=sw+"s";
},1000);
}

function stopStopwatch(){
clearInterval(interval);
}

/* SORT */
function setSort(type){
currentSort=type;
render();
}

/* THEME */
function toggleTheme(){
document.body.classList.toggle("dark");
localStorage.setItem("theme", document.body.classList.contains("dark")?"dark":"light");
}

/* LOAD THEME */
(function(){
if(localStorage.getItem("theme")==="dark"){
document.body.classList.add("dark");
}
})();



document.querySelectorAll(".color-ball").forEach(ball=>{
  ball.addEventListener("click", function(){
    
    let color = this.getAttribute("data-color");

    tasks[currentTaskIndex].category = color;

    // UI active highlight
    document.querySelectorAll(".color-ball").forEach(b=>b.classList.remove("active"));
    this.classList.add("active");

    save();
    render();
  });
});

/* INIT */
render();