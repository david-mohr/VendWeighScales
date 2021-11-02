chrome.commands.onCommand.addListener(function(command) {

	// Read weigh scales value
	if (command === "Ctrl+Shift+S") { 
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
							$.ajax({url: "http://localhost:3000/scale", success: onAjaxSuccess, error: onAjaxError});
							
							function onAjaxSuccess(result) {
								result = JSON.parse(result);
								if (result.err) {
									alert("ERROR: " + result.msg);
									return;
								}
								
								var weight = parseFloat(result.scaleWeight);
								if (weight == 0) {
									alert("ERROR: nothing on scale - its reading zero");
									return;
								}
								
								// vend defaults to 1 for qty. Assume no container is 1kn in weight
								var containerWeight = (response.val == 1) ? 0 : response.val; 
								if (containerWeight >= weight) {
											 alert("ERROR: the container weight is too large");
											 return;
								}
								
								chrome.tabs.sendMessage(
									tabs[0].id, 
									{type: "SetVal", val: (weight - containerWeight).toFixed(3)}, function(response) {});
								   
							}

							function onAjaxError(result) {
								alert("ERROR: possibly a problem with the node server. Please check http://localhost:3000 for more info.");
							}
						}
					}
				);
			}
		);
	}
	
	// Open the till draw
	if (command === "Ctrl+Shift+E") {
		
		$.ajax({url: "http://localhost:3000/till", success: onAjaxSuccess, error: onAjaxError});
			
		function onAjaxSuccess(result) {
			console.log("opened drawer");
		}

		function onAjaxError(result) {
			console.log("error with drawer");
		}
	}
}); 

