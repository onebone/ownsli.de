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
		do: 'left-up'
	}, {
		//left
		x: '-' + ANCHOR_SIZE_HALF,
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ew-resize',
		do: 'left'
	}, {
		//left-down
		x: '-' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'nesw-resize',
		do: 'left-down'
	}, {
		//down
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ns-resize',
		do: 'down'
	}, {
		//down-right
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'nwse-resize',
		do: 'right-down'
	}, {
		//right
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'ew-resize',
		do: 'right'
	}, {
		//right-up
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF,
		pointer: 'nesw-resize',
		do: 'right-up'
	}, {
		//up
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF,
		pointer: 'ns-resize',
		do: 'up'
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
		utils.bindPropertyToAttribute(_this.object, _this, v, function(prev, curr){
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

		var initialScale = {
			w: parseInt(node.getAttribute('data-os-width')),
			h: parseInt(node.getAttribute('data-os-height'))
		};

		interact(anchor)
			.origin('self')
			.draggable({
				origin: [initialScale.x, initialScale.y]
			})
			.on('dragstart', function(event){
				initialScale = {
					w: parseInt(node.getAttribute('data-os-width')),
					h: parseInt(node.getAttribute('data-os-height'))
				};
			})
			.on('dragend', function(event){
				_this.updateAnchor();
			})
			.on('dragmove', function(event){
				//Original XYWH of object
				var ox = parseInt(node.getAttribute('data-os-x'));
				var oy = parseInt(node.getAttribute('data-os-y'));
				var ow = parseInt(node.getAttribute('data-os-width'));
				var oh = parseInt(node.getAttribute('data-os-height'));

				//Updated values
				var nw = Math.max(0, ow + event.dx);
				var nh = Math.max(0, oh + event.dy);

				//for left anchors
				var _nw = Math.max(0, ow - event.dx);

				//for top anchors
				var _nh = Math.max(0, oh - event.dy);

				//Calculated values from initialScale to scale-preserved resizing
				var ch;
				var _ch; //ch for leftanchors

				//if the resizing method is scale-preserved resizing,
				if(v.do === 'left-up' || v.do === 'left-down' || v.do === 'right-up' || v.do === 'right-down'){
					if(initialScale){
						ch = Math.round(initialScale.h / initialScale.w * nw);
						_ch = Math.round(initialScale.h / initialScale.w * (nw - 2 * event.dx));
					}
				}

				switch(v.do){
					case 'left-up':
						if(!initialScale) break;
						node.setAttribute('data-os-width', _nw);
						node.setAttribute('data-os-height', _ch);

						node.setAttribute('data-os-x', ox + event.dx);
						node.setAttribute('data-os-y', oy + (oh - _ch));
						break;

					case 'left':
						node.setAttribute('data-os-width', _nw);

						node.setAttribute('data-os-x', ox + event.dx);
						break;

					case 'left-down':
						if(!initialScale) break;
						ch = initialScale.h / initialScale.w * (_nw);
						node.setAttribute('data-os-width', _nw);
						node.setAttribute('data-os-height', ch);

						node.setAttribute('data-os-x', ox + event.dx);
						break;

					case 'down':
						node.setAttribute('data-os-height', nh);
						break;

					case 'right-down':
						if(!initialScale) break;
						node.setAttribute('data-os-width', nw);
						node.setAttribute('data-os-height', ch);
						break;

					case 'right':
						node.setAttribute('data-os-width', nw);
						break;

					case 'right-up':
						if(!initialScale) break;
						node.setAttribute('data-os-width', nw);
						node.setAttribute('data-os-height', ch);
						node.setAttribute('data-os-y', oy + (oh - ch));
						break;

					case 'up':
						node.setAttribute('data-os-height', _nh);

						node.setAttribute('data-os-y', oy + event.dy);
						break;

					case 'rotation':
						//TODO
						break;
				}

				_this.updateNode();
				//_this.updateAnchor();
			});
		_this.workspace.append(anchor);

		return anchor;
	});

	node.addEventListener('os:update', function(){
		//_this.updateAnchor();
	});

	this.updateAnchor();
}

Morph.prototype.updateNode = function(){
	var obj = this.object;
	var objW = parseInt(obj.getAttribute('data-os-width'));
	var objH = parseInt(obj.getAttribute('data-os-height'));
	var objX = Math.round(parseInt(obj.getAttribute('data-os-x')));
	var objY = Math.round(parseInt(obj.getAttribute('data-os-y')));
	var objZ = Math.round(parseInt(obj.getAttribute('data-os-z')));
	var objRotation = Math.round(parseInt(obj.getAttribute('data-os-rotation')));
	obj.style.width = objW + 'px';
	obj.style.height = objH + 'px';

	var centerX = objX + Math.round(objW / 2);
	var centerY = objY + Math.round(objH / 2);

	obj.style.transformOrigin = centerX + 'px ' + centerY + 'px';
	obj.style.transform = "rotate(" + objRotation + "deg) translate3d(" + objX + "px, " + objY + "px, " + objZ + "px)";

	var ev = new Event('os:update');
	obj.dispatchEvent(ev);
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
		v.style.transform = "rotate(" + objRotation + "deg) translate3d(calc(" + anchorX + " + " + objX + "px), calc(" + anchorY + " + " + objY + "px), " + objZ + "px)";
	});
};

Morph.parseAnchorSyntax = function(statement, width, height){
	return statement
	.split(WIDTH).join(width + 'px')
	.split(WIDTH_HALF).join(Math.round(width / 2) + 'px')
	.split(HEIGHT).join(height + 'px')
	.split(HEIGHT_HALF).join(Math.round(height / 2) + 'px');
};


module.exports = Morph;
