browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.type === "requestData"){
    const responseData = JSON.parse(localStorage.getItem("autoChimeValues"))
    sendResponse({data: responseData})
  }
})