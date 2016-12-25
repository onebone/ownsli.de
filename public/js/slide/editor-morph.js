(function(){
	//상수 선언
	var ANCHORS = [
		'left', 'right', 'up', 'down',
		'up-left', 'up-right', 'down-left', 'down-right',
		'rotation'
	];
	Object.freeze(ANCHORS);

	//Morph 제작
	function Morph(node){
		this.object = node;
	}

	Morph.prototype.initAnchors = function(){
		ANCHORS.forEach(function(v){
			
		});
	};
})();
