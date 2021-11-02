chrome.commands.onCommand.addListener(function(command) {
	if (command === "Ctrl+Shift+A") { 

		chrome.tabs.query(
			{active: true, currentWindow: true}, 
			function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {type: "GetVal"}, 
					function(response) {
						if (typeof response != "undefined" 
							&& typeof response.val != "undefined" 
							&& !isNaN(response.val) 
							&& response.val != "") 
						{

								$.ajax({url: "http://localhost:3000", success: onAjaxSuccess, error: onAjaxError});
								
							function onAjaxSuccess(result) {
								result = JSON.parse(result);	 
								if (true) {
									var weight = parseFloat(result.scaleWeight);
									var containerWeight = response.val;
									if (containerWeight == 1) containerWeight = 0; // vend defaults to 1 for qty. Assume no container is 1kn in weight
									if (containerWeight >= weight) {
												 alert("ERROR: the container weight is too large");
									} else {
										chrome.tabs.sendMessage(
											tabs[0].id, 
											{type: "SetVal", val: "0" + (weight - containerWeight)}, function(response) {});
									}    
								}
							}

							function onAjaxError(result) {
								alert("ERROR: possibly a problem with the serial connection to the weigh scale");
							}
						}
					}
				);
			}
		);
	}
}); 

