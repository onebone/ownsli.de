(function(){
	//상수 선언
	var ANCHOR_SIZE_HALF = '5px';
	var WIDTH_HALF = 'width_half',
	var WIDTH = 'width_full';
	var HEIGHT_HALF = 'height_half';
	var HEIGHT = 'height_full';

	var ANCHORS = [
		{
			//left-up
			x: '-' + ANCHOR_SIZE_HALF,
			y: '-' + ANCHOR_SIZE_HALF
		}, {
			//left
			x: '-' + ANCHOR_SIZE_HALF,
			y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF
		}, {
			//left-down
			x: '-' + ANCHOR_SIZE_HALF,
			y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF
		}, {
			//down
			x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
			y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF
		}, {
			//down-right
			x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
			y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF
		}, {
			//right
			x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
			y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF
		}, {
			//right-up
			x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
			y: '-' + ANCHOR_SIZE_HALF
		}, {
			//up
			x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
			y: '-' + ANCHOR_SIZE_HALF
		}, {
			//rotation
			x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
			y: '-' + '20px'
		}
	];

	Object.freeze(ANCHORS);

	//Morph 제작
	function Morph(node){
		this.object = node;
		var _this = this;
		['x', 'y', 'width', 'height', 'rotation'].forEach(function(v){
			utils.bindPropertyToAttribute(this.object, this, v, function(prev, curr){
				_this.onUpdate(prev, curr);
			});
		});

		this.anchors = ANCHORS.forEach(function(v){
			//TODO
		});
	}

	Morph.prototype
})();
