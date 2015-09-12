// exports.printMsg = function() {
//   console.log("Hello World IndianaJS :)");
// }

var spatialAwareness = function() {
	var kitchenitems = [
	  {uri: "microwave",
	    location: {dir: 350},
	    color: "blue"
	  },
	  {uri: "flower",
	    location: {dir: 270},
	    color: "red"
	  },
	  {uri: "lamp",
	    location: {dir: 80},
	    color: "white",
	    controlON: "http://cumulus.teco.edu:81/21345gjphtnch87/ON",
	    controlOFF: "http://cumulus.teco.edu:81/21345gjphtnch87/OFF"
	  },
	  {uri: "coffeemachine",
	    location: {dir: 190},
	    color: "black"
	  },
	  {uri: "fridge",
	    location: {dir: 200},
	    color: "gray"
	  }
	];
	var originalOrientation = {tiltLR: 0, tiltFB: 0, dir: 0};
	var currentOrientation = {tiltLR: 0, tiltFB: 0, dir: 0};
	var position = {x:0, y:0};

	var itemsArray = [];
	var range = 10;
	
	function init() {
		var initialResetDone = false;

		initDeviceOrientation(function(tiltLR,tiltFB,dir) {

			// console.log("Original direction:",originalOrientation.dir);
			currentOrientation.tiltLR = tiltLR;
			currentOrientation.tiltFB = tiltFB;
			currentOrientation.dir = dir;

			if(!initialResetDone) {
				originalOrientation.tiltLR = currentOrientation.tiltLR;
				originalOrientation.tiltFB = currentOrientation.tiltFB;
				originalOrientation.dir = currentOrientation.dir;
				initialResetDone = true;
			}
			var event = new CustomEvent('deviceorientation2', 
				{detail: {orientation: getOrientation(), items: itemsArray}});
			document.dispatchEvent(event);
			checkFront(range);
		});

		// initKinekt();
	}

	function initDeviceOrientation(cb) {
		if (window.DeviceOrientationEvent) {
			// document.getElementById("doEvent").innerHTML = "DeviceOrientation";
			// Listen for the deviceorientation event and handle the raw data
			window.addEventListener('deviceorientation', 
		    	function(eventData) {
					// gamma is the left-to-right tilt in degrees, where right is positive
					var tiltLR = eventData.gamma;

					// beta is the front-to-back tilt in degrees, where front is positive
					var tiltFB = eventData.beta;

					// alpha is the compass direction the device is facing in degrees
					var dir = eventData.alpha;

					// call our orientation event handler
					cb(tiltLR, tiltFB, dir);
				}, false);
		} else {
			console.log("Device orientation is not supported on your device or browser.");
		}
	}
	function initKinekt(cb) {
		// checks if there is a kinekt...
		// connects to kinekt, returns data in callback on status changes
	}

	function normalizeDegree(d) {
		d = (d>=360) ? 360 - d : d;
		d = (d<0) ? 360 + d : d;
		return d;
	}

	function ajaxRequest(url, type, data, cb, cbe) {
		console.log(url)
		$.ajax({
			url: url,
			method: type,
			data: data
		}).done(function(data) {
			console.log("Ajax Success:",data)
			// $("#qrcodedivdata").html(data)
			cb(data)
		}).fail(function(jqXHR, textStatus) {  
			console.log( "Ajax request failed: " + textStatus, jqXHR );
			// $("#qrcodedivdata").html(textStatus)
			cbe(jqXHR)
		});
	}

	// Dispatch foundItemInFront and noItemInFront events only once if it does't change!
	var foundItem = '';
	function checkFront(range) {
		var dir = getOrientation().dir;
		// console.log(dir)
		var count = Object.keys(itemsArray).length;
		$.each(itemsArray, function(key, item) {
			var itemlocation = item.location.dir;
			var difference = Math.abs(dir - itemlocation);
			if(difference < range/2) {
				if(key != foundItem) {
					// console.log(foundItem, key);
					foundItem = key;
					var event = new CustomEvent('foundItemInFront', {detail: {key:key, value:item}}	);
					document.dispatchEvent(event);
				}
			} else {
				count--;
				if(foundItem != '' && count == 0) {
					// console.log('notfound',count,foundItem);
					foundItem = '';
					var event = new CustomEvent('noItemInFront');
					document.dispatchEvent(event);
				}
			}
		})
	}

	/* Teil der API
	 Returns a string representing the 2D location expressed in a 8 point cardinal direction
	 This results in a 45 degree cone for each cardinal direction

	 NW N NE
	 W  .  E
	 SW S SE

	*/
	function getThingCardinalPosition(thing){
	    var degree = getThingPosition2DinDegree(thing);
	    if (degree <= 22.5 || degree > (360-22.5))
	        return 'N';
	    if (degree <= (45+22.5) && degree > 22.5)
	        return 'NW';
	    if (degree <= (90+22.5) && degree > (45+22.5))
	        return 'W';
	    if (degree <= (135+22.5) && degree > (90+22.5))
	        return 'SW';
	    if (degree <= (180+22.5) && degree > (135+22.5))
	        return 'S';
	    if (degree <= (225+22.5) && degree > (180+22.5))
	        return 'SE';
	    if (degree <= (270+22.5) && degree > (225+22.5))
	        return 'E';
	    if (degree <= 315+22.5 && degree > (270+22.5))
	        return 'NE';
	}
	function getThingPosition2DinDegree(thing) {
		var dir = normalizeDegree(itemsArray[thing].location.dir-getOrientation().dir);
		// setInterval(function() {
			// console.log(thing, dir)
		// }, 10000);
		return dir;
	}
	// function registerItems(items) {
	// 	if(items.constructor == Object) {
	// 		for(var key in items) {
	// 			var item = items[key];
	// 			if(!item.uri || !item.location) {
	// 				console.log("ERROR: An item doesn't contain a uri or location:", item);
	// 				console.log(items)
	// 				return false;
	// 			}
	// 		}
	// 		itemsArray = items;
	// 		return true;
	// 	}
	// 	console.log("ERROR: This function can only register an array of items.")
	// 	return false;
	// }
	function getOrientation() {
		var orientation = {}
		orientation.tiltLR = currentOrientation.tiltLR - originalOrientation.tiltLR;
		orientation.tiltFB = currentOrientation.tiltFB - originalOrientation.tiltFB;
		orientation.dir = normalizeDegree(currentOrientation.dir - originalOrientation.dir);
		return orientation;
	}
	function getRoomData(cb) {
		var url = window.location.pathname + "/items";
		ajaxRequest(url,"GET", {}, function(data) {
			// console.log("Ajax success:", data);
			itemsArray = data;
			init();
			cb(data);
		}, function(err) {
			// console.log("Ajax error:", err);
			itemsArray = kitchenitems;
			init();
			cb(kitchenitems);
		});
	}
	function updateItem(id, obj) {
		// console.log('before',itemsArray[id])
		if(itemsArray[id]){
			$.extend(itemsArray[id],obj);
			var event = new CustomEvent('itemDataChanged', {detail: itemsArray[id]}	);
			document.dispatchEvent(event);
		}
		// console.log('after',itemsArray[id])
	}
	return {
		// registerItems : registerItems,
		updateItem : updateItem,
		getPosition : function() {
			return position;
		},
		getOrientation : getOrientation,
		resetOrientation : function() {
			originalOrientation.tiltLR = currentOrientation.tiltLR;
			originalOrientation.tiltFB = currentOrientation.tiltFB;
			originalOrientation.dir = currentOrientation.dir;
			console.log("Reseted orientation at:", currentOrientation);
		},
		getThingCardinalPosition: getThingCardinalPosition,
		getThingPosition2DinDegree: getThingPosition2DinDegree,
		getRoomData : getRoomData,
		activateQRCodeReader : activateQRCodeReader,
		deactivateQRCodeReader : function(divselector) {
			$(divselector).html5_qrcode_stop();
			$(divselector).html('')
			// $(divselector+"data").html('')
			// $(divselector+"err").html('')
		},
		buildRadar : function(divselector) {
			var width = window.innerWidth,
				height = window.innerHeight,
				radius = Math.min(width, height),
				radarRadius = Math.round(radius/3),
				itemradius = radarRadius/10;

			var spacetime = d3.select(divselector);
			var svg = spacetime.append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			svg.append("circle")
				.attr("r", radius/20)
				.style("fill", "rgba(255, 204, 0, 1.0)");

			svg.append("circle")
				.attr("r", radarRadius)
				.style("fill", "none")
				.style("stroke", "rgba(0, 0, 0, 1)");


			$.each(items, function(key, val){
				var x = -radarRadius*Math.sin((val.location.dir-getOrientation().dir)*Math.PI/180);
				var y = -radarRadius*Math.cos((val.location.dir-getOrientation().dir)*Math.PI/180);
				// console.log(x,y)
				svg.append("circle")
					.attr("class", "radarItems")
					.attr("uri", val.uri)
					.attr("r", itemradius)
					.attr("transform", "translate("+x+"," + y + ")")
					.style("stroke", "black")
					.style("fill", val.color);
			});
		}
	}

	function activateQRCodeReader(divselector, cb) {
		$(divselector).html5_qrcode(function(data) {
		        // do something when code is read
				// $(divselector+"data").html(data);
		    	console.log(data)
		    	var r = confirm("Are you in TECO kitchen?")
		    	if(r) {
					ajaxRequest("http://localhost:8080/kitchen","GET", {}, function(data) {
						console.log("Ajax success:", data);
		    			init();
						itemsArray = data;
						cb(data)
					}, function(err) {
						console.log("Ajax error:", err);
						// $("#qrcodediverr").html(err.statusText)
					});
		    		// $(divselector+"data").html("Welcome to TECO kitchen.")
		    	} else {
		    		init();
					itemsArray = kitchenitems;
		    		cb(kitchenitems);
		    	}
		    }, function(error){
		        //show read errors 
				// $(divselector+"err").html(error)
		        // console.log(error)
		    }, function(videoError){
		        //the video stream could be opened
		        console.log(videoError)
		    })
	}
}