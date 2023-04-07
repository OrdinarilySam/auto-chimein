const toggleButton = document.createElement('button')

toggleButton.innerText = "O"
toggleButton.className = "switch-btn toggle-off-btn"
toggleButton.id = "toggleBtn"

document.body.appendChild(toggleButton)

injectionString = `
  let isRunning = false; 
  const toggleButton = document.getElementById("toggleBtn"); 

  function handleMessage(msg){
    if(!(isRunning && msg.data.includes("Session"))) return;
    const params = {content: "Placeholder content"};
    if(msg.data.includes("StartSession")){
      const data = JSON.parse(msg.data.substring(2))[2]
      const answerData = []
      const answerText = []
      const questionText = data['session']['question']['text']
      data['session']['question']['question_info']['question_responses'].forEach((question, index) => {
        if(question['correct']){
          answerText.push(\`\${index + 1}: \${question['text'].substring(3, question['text'].length - 4)}\`)
          answerData.push(index)
        }
      })
      params.content = \`Chime in opened, correct answers: \${answerText.join(", ")}. Attempting to answer...\`
      setTimeout(() => {
        const elements = document.querySelectorAll("article.participant-prompt")
        elements.forEach((element, index) => {
          if(element.childNodes[0].childNodes[1].childNodes[0].childNodes[0].innerHTML = questionText){
            const options = element.childNodes[1].childNodes[0].childNodes[0].children
            options[answerData[0]].childNodes[0].click()
          }
        })
        const request = new XMLHttpRequest()
        request.open("POST", "https://discord.com/api/webhooks/1091399045660028948/8YqZNyQyF63DRFsqEw0v7EwlSQBfEGqJ0qKXchGFKampOu8WF52FqRUAeR5kxlv6FcHK");
        request.setRequestHeader('Content-type', 'application/json');
        request.send(JSON.stringify({content: "Correct answer selected!"}));
      }, 3000)
    }else{
      params.content = "Chime in session ended."
    }
    const request = new XMLHttpRequest()
    request.open("POST", "https://discord.com/api/webhooks/1091399045660028948/8YqZNyQyF63DRFsqEw0v7EwlSQBfEGqJ0qKXchGFKampOu8WF52FqRUAeR5kxlv6FcHK");
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify(params));
  }

  function socketSniffer(){
    WebSocket.prototype._send = WebSocket.prototype.send;
      WebSocket.prototype.send = function (data) {
        this._send(data);
        this.addEventListener('message', handleMessage, false);
        this.send = function (data) {
          this._send(data);
        };
      }
  }

  toggleButton.addEventListener("click", ()=> {
    if(isRunning){
      isRunning = false;
      toggleButton.textContent = "O"
      toggleButton.className = "toggle-off-btn switch-btn"
    }else{
      isRunning = true;
      toggleButton.textContent = "I"
      toggleButton.className = "toggle-on-btn switch-btn"
    }
  })

  socketSniffer();
`

const script = document.createElement('script');
script.textContent = injectionString;
(document.head || document.documentElement).appendChild(script);