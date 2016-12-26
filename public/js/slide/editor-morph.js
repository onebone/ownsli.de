//상수 선언
var ANCHOR_SIZE_HALF = '3px';
var WIDTH_HALF = 'width_half';
var WIDTH = 'width_full';
var HEIGHT_HALF = 'height_half';
var HEIGHT = 'height_full';

var ANCHORS = [
	{
		//left-up
		x: '-' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF,
		pointer: 'nwse-resize',
		do: 'left-up-diagonal'
	}, {
		//left
		x: '-' + ANCHOR_SIZE_HALF,
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ew-resize',
		do: 'left-right'
	}, {
		//left-down
		x: '-' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'nesw-resize',
		do: 'left-down-diagonal'
	}, {
		//down
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ns-resize',
		do: 'up-down'
	}, {
		//down-right
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'nwse-resize',
		do: 'left-up-diagonal'
	}, {
		//right
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ew-resize',
		do: 'left-right'
	}, {
		//right-up
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF,
		pointer: 'nesw-resize',
		do: 'left-down-diagonal'
	}, {
		//up
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF,
		pointer: 'ns-resize',
		do: 'up-down'
	}, {
		//rotation
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF + ' - ' + '20px',
		pointer: 'url(/cursor/cursor-rotate.cur), all-scroll',
		do: 'rotate'
	}
];

Object.freeze(ANCHORS);

//Morph 제작
function Morph(node, workspace){
	this.object = node;
	this.workspace = workspace.workspace;
	var _this = this;
	['x', 'y', 'width', 'height', 'rotation'].forEach(function(v){
		utils.bindPropertyToAttribute(this.object, this, v, function(prev, curr){
			_this.onUpdate(prev, curr);
		});
	});

	this.anchors = ANCHORS.map(function(v){
		var anchor = document.createElement('div');
		anchor.setAttribute('class', 'os-morph-anchor');
		anchor.setAttribute('data-os-morph-anchor-x', v.x);
		anchor.setAttribute('data-os-morph-anchor-y', v.y);
		anchor.setAttribute('data-os-morph-anchor-do', v.do);
		anchor.style.cursor = v.pointer;

		_this.workspace.append(anchor);

		return anchor;
	});

	node.addEventListener('os:update', function(){
		_this.updateAnchor();
	});

	this.updateAnchor();
}

Morph.parseAnchorSyntax = function(statement, width, height){
	return statement
		.split(WIDTH).join(width + 'px')
		.split(WIDTH_HALF).join(Math.round(width / 2) + 'px')
		.split(HEIGHT).join(height + 'px')
		.split(HEIGHT_HALF).join(Math.round(height / 2) + 'px');
};

Morph.prototype.updateAnchor = function(){
	var obj = this.object;
	var objW = parseInt(obj.getAttribute('data-os-width'));
	var objH = parseInt(obj.getAttribute('data-os-height'));
	var objX = Math.round(parseInt(obj.getAttribute('data-os-x')));
	var objY = Math.round(parseInt(obj.getAttribute('data-os-y')));
	var objZ = Math.round(parseInt(obj.getAttribute('data-os-z')));
	var objRotation = Math.round(parseInt(obj.getAttribute('data-os-rotation')));

	this.anchors.forEach(function(v){
		var anchorX = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-x"), objW, objH);
		var anchorY = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-y"), objW, objH);

		v.style.transformOrigin = v.style.webkitTransformOrigin = v.style.mozTransformOrigin = v.style.msTransformOrigin =
			objX + 'px ' + objY + 'px ' + objZ + 'px';
		v.style.transform = "rotate(" + objRotation + "deg) translate(calc(" + anchorX + " + " + objX + "px), calc(" + anchorY + " + " + objY + "px))"
	});
};


module.exports = Morph;
