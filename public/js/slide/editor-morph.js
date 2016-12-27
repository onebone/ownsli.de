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
		//rotationX
		x: WIDTH + ' - ' + ANCHOR_SIZE_HALF + ' + ' + '20px',
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'url(/cursor/cursor-rotate.cur), all-scroll',
		do: 'rotate-x'
	}, {
		//rotationY
		x: WIDTH_HALF + ' - ' + ANCHOR_SIZE_HALF,
		y: '-' + ANCHOR_SIZE_HALF + ' - ' + '20px',
		pointer: 'url(/cursor/cursor-rotate.cur), all-scroll',
		do: 'rotate-y'
	}, {
		//rotationZ
		x: '-' + ANCHOR_SIZE_HALF + ' - ' + '20px',
		y: HEIGHT_HALF + ' - ' + ANCHOR_SIZE_HALF,
		pointer: 'url(/cursor/cursor-rotate.cur), all-scroll',
		do: 'rotate-z'
	}
];

Object.freeze(ANCHORS);

//Morph 제작
function Morph(node, workspace){
	this.object = node;
	this.workspace = workspace;
	var _this = this;
	['os-x', 'os-y', 'os-z', 'os-width', 'os-height', 'os-rotation-x', 'os-rotation-y', 'os-rotation-z'].forEach(function(v){
		utils.bindPropertyToAttribute(_this.object, _this, v);
	});


	var lastNode = {x: parseInt(this['os-x']), y: parseInt(this['os-y'])};

	this.interactableObject = interact(node)
		.origin('self')
		.draggable({})
		.on('dragmove', function(event){
			var ox = parseInt(_this['os-x']);
			var oy = parseInt(_this['os-y']);

			event.dx += ox - lastNode.x;
			event.dy += oy - lastNode.y;

			_this['os-x'] = ox + event.dx;
			_this['os-y'] = oy + event.dy;

			lastNode = {
				x: ox,
				y: oy
			};
			_this.updateNode();
		});

	this.anchors = ANCHORS.map(function(v){
		var anchor = document.createElement('div');
		anchor.setAttribute('class', 'os-morph-anchor');
		anchor.setAttribute('data-os-morph-anchor-x', v.x);
		anchor.setAttribute('data-os-morph-anchor-y', v.y);
		anchor.setAttribute('data-os-morph-anchor-do', v.do);
		anchor.style.cursor = v.pointer;

		var initialScale = {
			w: parseInt(_this['os-width']),
			h: parseInt(_this['os-height'])
		};

		var last = {w: initialScale.w, h: initialScale.h};

		interact(anchor)
			.origin('self')
			.draggable({
				origin: [initialScale.x, initialScale.y]
			})
			.on('dragstart', function(event){
				initialScale = {
					w: parseInt(_this['os-width']),
					h: parseInt(_this['os-height'])
				};
			})
			.on('dragend', function(event){
				_this.updateAnchor();
			})
			.on('dragmove', function(event){
				//Original XYWH of object
				var ox = parseInt(_this['os-x']);
				var oy = parseInt(_this['os-y']);
				var ow = parseInt(_this['os-width']);
				var oh = parseInt(_this['os-height']);

				var needsRev = (v.do.includes('left') || v.do.includes('up')) && v.do !== 'right-up';
				event.dx += (ow - last.w) * (needsRev ? -1 : 1);
				event.dy += (oh - last.h) * (needsRev ? -1 : 1);
				last = {
					w: ow, h: oh
				};
				// FIXME 대각선으로 조정한 경우 다음 조정이 제대로 이루어지지 않음

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
						_this['os-width'] = _nw;
						_this['os-height'] = _ch;

						_this['os-x'] = ox + event.dx;
						_this['os-y'] = oy + (oh - _ch);
						break;

					case 'left':
						_this['os-width'] = _nw;

						_this['os-x'] = ox + event.dx;
						break;

					case 'left-down':
						if(!initialScale) break;
						ch = initialScale.h / initialScale.w * (_nw);
						_this['os-width'] = _nw;
						_this['os-height'] = ch;

						_this['os-x'] = ox + event.dx;
						break;

					case 'down':
						_this['os-height'] = nh;
						break;

					case 'right-down':
						if(!initialScale) break;
						_this['os-width'] = nw;
						_this['os-height'] = ch;
						break;

					case 'right':
						_this['os-width'] = nw;
						break;

					case 'right-up':
						if(!initialScale) break;
						_this['os-width'] = nw;
						_this['os-height'] = ch;
						_this['os-y'] = oy + (oh - ch);
						break;

					case 'up':
						_this['os-height'] = _nh;

						_this['os-y'] = oy + event.dy;
						break;

					case 'rotate-x':
						_this['os-rotation-x'] = parseInt(_this['os-rotation-x']) + event.dy;
						_this.updateNode(true);
						return;

					case 'rotate-y':
						_this['os-rotation-y'] = parseInt(_this['os-rotation-y']) + event.dx;
						_this.updateNode(true);
						return;

					case 'rotate-z':
						_this['os-rotation-z'] = parseInt(_this['os-rotation-z']) - event.dy;
						_this.updateNode(true);
						return;
				}

				_this.updateNode();
			});
		_this.workspace.addToWorkspace(anchor);

		return anchor;
	});

	this.updateAnchor();
}

Morph.prototype.updateNode = function(disableAnchorUpdate){
	var obj = this.object;
	var objW = parseInt(this['os-width']);
	var objH = parseInt(this['os-height']);
	var objX = Math.round(parseInt(this['os-x']));
	var objY = Math.round(parseInt(this['os-y']));
	var objZ = Math.round(parseInt(this['os-z']));
	var objRotationX = Math.round(parseInt(this['os-rotation-x']));
	var objRotationY = Math.round(parseInt(this['os-rotation-y']));
	var objRotationZ = Math.round(parseInt(this['os-rotation-z']));

	obj.style.width = objW + 'px';
	obj.style.height = objH + 'px';

	var centerX = objX + Math.round(objW / 2);
	var centerY = objY + Math.round(objH / 2);

	obj.style.transformOrigin = obj.style.webkitTransformOrigin = obj.style.mozTransformOrigin = obj.style.msTransformOrigin =
		centerX + 'px ' + centerY + 'px';
	obj.style.transform = "rotateX(" + objRotationX + "deg) rotateY(" + objRotationY + "deg) rotateZ(" + objRotationZ + "deg) translate3d(" + objX + "px, " + objY + "px, " + objZ + "px)";

	var ev = new Event('os:update');
	obj.dispatchEvent(ev);

	if(!disableAnchorUpdate) this.updateAnchor();
};

Morph.prototype.updateAnchor = function(){
	var objW = parseInt(this['os-width']);
	var objH = parseInt(this['os-height']);
	var objX = Math.round(parseInt(this['os-x']));
	var objY = Math.round(parseInt(this['os-y']));
	var objZ = Math.round(parseInt(this['os-z']));
	var objRotationX = Math.round(parseInt(this['os-rotation-x']));
	var objRotationY = Math.round(parseInt(this['os-rotation-y']));
	var objRotationZ = Math.round(parseInt(this['os-rotation-z']));

	this.anchors.forEach(function(v){
		var anchorX = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-x"), objW, objH);
		var anchorY = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-y"), objW, objH);

		v.style.transformOrigin = v.style.webkitTransformOrigin = v.style.mozTransformOrigin = v.style.msTransformOrigin =
			(objX + objW / 2) + 'px ' + (objY + objH / 2) + 'px ' + objZ + 'px';
		v.style.transform = "rotateX(" + objRotationX + "deg) rotateY(" + objRotationY + "deg) rotateZ(" + objRotationZ + "deg) translate3d(calc(" + anchorX + " + " + objX + "px), calc(" + anchorY + " + " + objY + "px), " + objZ + "px)";
	});
};

Morph.prototype.destroy = function(){
	this.anchors.forEach(function(v){
		v.remove();
	});

	this.interactableObject.unset();
};

Morph.parseAnchorSyntax = function(statement, width, height){
	return statement
	.split(WIDTH).join(width + 'px')
	.split(WIDTH_HALF).join(Math.round(width / 2) + 'px')
	.split(HEIGHT).join(height + 'px')
	.split(HEIGHT_HALF).join(Math.round(height / 2) + 'px');
};


module.exports = Morph;
