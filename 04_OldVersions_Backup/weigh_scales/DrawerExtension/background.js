chrome.commands.onCommand.addListener(function(command) {
	if (command === "Ctrl+Shift+E") { 

							$.ajax({url: "http://localhost:3001", success: onAjaxSuccess, error: onAjaxError});
								
							function onAjaxSuccess(result) {
								console.log("opened drawer");
							}

							function onAjaxError(result) {
								console.log("error with drawer");
							}
						
	}
}); 

