chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {  

    if (request.type == "GetVal") {
      sendResponse({val: document.activeElement.value});
	}
	else if (request.type == "SetVal") {
        document.activeElement.value = request.val;
	} else {

	}
		
  });
  
