module.exports = function(clockObject){
	var updateClock = function(){
		clockObject.innerText = (new Date()).toLocaleTimeString();
		setTimeout(updateClock, 750);
	};

	updateClock();
};
