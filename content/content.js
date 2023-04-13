const toggleButton = document.createElement("button");

toggleButton.innerText = "O";
toggleButton.className = "switch-btn toggle-off-btn";
toggleButton.id = "toggleBtn";

document.body.appendChild(toggleButton);

let injectionString = `
  let isRunning = false; 
  let sendPings = false;
  const toggleButton = document.getElementById("toggleBtn");
  let discordWebhookUrl = ""
  `;

// listens for messages from the injection script to receive data, then requests
// that data from the background script and sends the response back to the injection
window.addEventListener("message", async (event) => {
  if (event.data.type === "requestData") {
    const responseData = await browser.runtime.sendMessage({
      type: "requestData",
    });
    window.postMessage(
      { type: "dataReceived", data: responseData.data },
      event.origin
    );
  }
});

// returns a promise to allow for asynchronous execution to ensure the data is received
// creates an event listener to handle the message then deletes it to prevent duplicates
// promise waits for data from content (not injected) to come back
async function requestData() {
  return new Promise((resolve, reject) => {
    function handleMessage(msg) {
      if (msg.data.type === "dataReceived") {
        sendPings = msg.data.data.pings;
        discordWebhookUrl = msg.data.data.url;
        resolve(msg.data.data);
        window.removeEventListener("message", handleMessage);
      }
    }
    window.addEventListener("message", handleMessage);
    window.postMessage({ type: "requestData" }, "*");
  });
}

// sends a webhook request to the discord if there is a webhook url saved
// and sendpings is enabled
async function sendWebhook(msg) {
  await requestData();
  if (sendPings && discordWebhookUrl) {
    const request = new XMLHttpRequest();
    request.open("POST", discordWebhookUrl);
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({ content: msg }));
  }
}

function handleMessage(msg) {
  // handles a new message from the websocket
  // guard clause to check that the scanner is enabled and the message has data
  if (!(isRunning && msg.data.includes("Session"))) return;
  if (msg.data.includes("StartSession")) {
    const data = JSON.parse(msg.data.substring(2))[2];
    const answerData = [];
    const answerText = [];
    const questionText = data["session"]["question"]["text"].slice(3, -4);

    // checks each of the responses for the correct answers
    data["session"]["question"]["question_info"]["question_responses"].forEach(
      (question, index) => {
        if (question["correct"]) {
          // the index is set to answerdata and a string containing the correct answers to answertext
          answerText.push(question["text"].slice(3, -4));
          answerData.push(index);
        }
      }
    );
    // sends a webhook saying the chime in has opened
    sendWebhook(
      `ChimeIn opened, correct answers: **${answerText.join(
        ", "
      )}**.\n*Attempting to answer...*`
    );

    setTimeout(() => {
      // waits a few seconds before attempting to select the correct elements
      // very high level selector to capture both questions and responses as children
      const elements = document.querySelectorAll("article.participant-prompt");
      elements.forEach((element) => {
        if (
          element.childNodes[0].childNodes[1].childNodes[0].childNodes[0]
            .innerHTML === questionText
        ) {
          const options =
            element.childNodes[1].childNodes[0].childNodes[0].children;
          options[answerData[0]].childNodes[0].click();
          // creates a new webhook request to share that the answer was selected
          sendWebhook(`Option "**${answerText[0]}**" selected!`);
        }
      });
    }, 5000);
  } else {
    sendWebhook("ChimeIn session ended.");
  }
}

function socketSniffer() {
  // modifies the default websocket send function to add an event listener
  WebSocket.prototype._send = WebSocket.prototype.send;
  WebSocket.prototype.send = function (data) {
    this._send(data);
    this.addEventListener("message", handleMessage, false);
    this.send = function (data) {
      this._send(data);
    };
  };
}

// appends the functions then the toggle and a call to the socketsniffer function
injectionString += `
  \n${sendWebhook.toString()}
  \n${handleMessage.toString()}
  \n${socketSniffer.toString()}
  \n${requestData.toString()}\n`;
injectionString += `
  toggleButton.addEventListener("click", ()=> {
    if(isRunning){
      isRunning = false;
      toggleButton.textContent = "O";
      toggleButton.className = "toggle-off-btn switch-btn";
    }else{
      isRunning = true;
      toggleButton.textContent = "I";
      toggleButton.className = "toggle-on-btn switch-btn";
    }
  })

  socketSniffer();

`;

// appends the script to the dom
const script = document.createElement("script");
script.textContent = injectionString;
(document.head || document.documentElement).appendChild(script);
