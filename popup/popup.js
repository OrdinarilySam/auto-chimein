const discordPingsChk = document.getElementById("discordPingsChk");
const webhookUrlInp = document.getElementById("webhookUrlInp");
const optionsForm = document.getElementById("optionsForm");
const urlStatus = document.getElementById("urlStatus");
const pingsStatus = document.getElementById("pingsStatus")

const regex = /https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+/;

let values = { pings: true, url: null };
if (localStorage.getItem("autoChimeValues")) {
  values = JSON.parse(localStorage.getItem("autoChimeValues"));
  if (regex.test(values.url)) {
    urlStatus.textContent = "URL found";
  } else {
    urlStatus.textContent = "No URL";
  }
  if (values.pings) {
    discordPingsChk.checked = true;
    pingsStatus.textContent = "On"
  } else {
    discordPingsChk.checked = false;
    pingsStatus.textContent = "Off"
  }
}

function updateLocalStorage() {
  localStorage.setItem("autoChimeValues", JSON.stringify(values));
}

discordPingsChk.addEventListener("change", (event) => {
  if (event.target.checked) {
    values.pings = true;
    pingsStatus.textContent = "On"
  } else {
    values.pings = false;
    pingsStatus.textContent = "Off"
  }
  updateLocalStorage();
});

optionsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (regex.test(webhookUrlInp.value)) {
    values.url = webhookUrlInp.value;
    updateLocalStorage();
    urlStatus.textContent = "URL updated";
  } else {
    urlStatus.textContent = "Failed, not a valid URL";
  }
  webhookUrlInp.value = "";
});
