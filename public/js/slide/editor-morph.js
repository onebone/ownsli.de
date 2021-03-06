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
function Morph(node, target, is2D, deleteCallback, logCallback, wrapper){
	this.object = node;
	this.boundObjects = [];
	this.workspace = target;
	this.is2D = (is2D === undefined) ? false : is2D;

	var _this = this;
	['os-x', 'os-y', 'os-z', 'os-width', 'os-height', 'os-rotation-x', 'os-rotation-y', 'os-rotation-z'].forEach(function(v){
		utils.bindPropertyToAttribute(_this.object, _this, v, function(prev, next, prop){
			_this.boundObjects.forEach(function(v){
				v[prop] += next - prev;
				v.updateNode();
			});
		});
	});

	var lastNode = {x: parseInt(this['os-x']), y: parseInt(this['os-y'])};
	var start = {x: parseInt(this['os-x']), y: parseInt(this['os-y'])};

	this.interactableObject = interact(node)
		//.origin('self')
		.draggable({})
		.on('dragstart', function(event){
			start = {x: parseInt(_this['os-x']), y: parseInt(_this['os-y'])};
		})
		.on('dragend', function(event){
			if(wrapper && wrapper.object instanceof shape){
				socket.emit('update shape', {
					document: documentId,
					packets: [{
						slide: wrapper.object.parent.id,
						shape: wrapper.object.id,
						pos: {x: parseInt(_this['os-x']), y: parseInt(_this['os-y']), start: start},
					}]
				});
			}
		})
		.on('dragmove', function(event){
			var ox = parseInt(_this['os-x']);
			var oy = parseInt(_this['os-y']);

			_this.updateNode();
			var multiplier = 1;
			if(logCallback){
				multiplier = 1.5 / logCallback();
			}
			_this['os-x'] = ox + event.dx * multiplier;
			_this['os-y'] = oy + event.dy * multiplier;

			lastNode = {
				x: ox,
				y: oy
			};
		});

	this.anchors = ANCHORS.map(function(v){
		if(is2D){
			if(v.do === 'rotate-x' || v.do === 'rotate-y') return null;
		}
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

		var startPos = {
			x: parseInt(_this['os-x']),
			y: parseInt(_this['os-y'])
		};

		var last = {w: initialScale.w, h: initialScale.h};

		interact(anchor)
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

				if(wrapper && wrapper.object instanceof shape){
					socket.emit('update shape', { // for undo
						document: documentId,
						packets: [{
							slide: wrapper.object.parent.id,
							shape: wrapper.object.id,
							size: {
								x: parseInt(_this['os-width']),
								y: parseInt(_this['os-height']),
								start: {x: initialScale.w, y: initialScale.h}
							}
						}]
					});
				}
			})
			.on('dragmove', function(event){
				//Original XYWH of object

				/*if(logCallback){
					var xSign = 1;
					if(event.dx < 0){
						xSign = -1.5;
						event.dx = -event.dx;
					}

					var ySign = 1;
					if(event.dy < 0){
						ySign = -1.5;
						event.dy = -event.dy;
					}

					event.dx = xSign * Math.pow(event.dx, 1 / logCallback());
					event.dy = ySign * Math.pow(event.dy, 1 / logCallback());
				}*/

				var multiplier = 1;
				if(logCallback){
					multiplier = 1.3 / logCallback();
				}
				event.dx = event.dx * multiplier;
				event.dy = event.dy * multiplier;

				var ox = parseInt(_this['os-x']);
				var oy = parseInt(_this['os-y']);
				var ow = parseInt(_this['os-width']);
				var oh = parseInt(_this['os-height']);

				/*var needsRev = (v.do.includes('left') || v.do.includes('up')) && v.do !== 'right-up';
				event.dx += (ow - last.w) * (needsRev ? -1 : 1);
				event.dy += (oh - last.h) * (needsRev ? -1 : 1);
				last = {
					w: ow, h: oh
				};*/
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
		_this.workspace.append(anchor);

		return anchor;
	});

	if(deleteCallback && typeof deleteCallback === 'function'){
		var anchor = document.createElement('a');
		anchor.setAttribute('class', 'os-morph-anchor os-morph-delete-anchor');
		anchor.setAttribute('data-os-morph-anchor-x', '-30px');
		anchor.setAttribute('data-os-morph-anchor-y', '-30px');
		anchor.setAttribute('data-os-morph-anchor-do', 'remove');
		anchor.addEventListener('click', deleteCallback);
		anchor.innerHTML = '&times;';
		this.anchors.push(anchor);
		this.workspace.append(anchor);
	}
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
		if(!v) return;
		var anchorX = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-x"), objW, objH);
		var anchorY = Morph.parseAnchorSyntax(v.getAttribute("data-os-morph-anchor-y"), objW, objH);

		v.style.transformOrigin = v.style.webkitTransformOrigin = v.style.mozTransformOrigin = v.style.msTransformOrigin =
			(objX + objW / 2) + 'px ' + (objY + objH / 2) + 'px ' + objZ + 'px';
		v.style.transform = "rotateX(" + objRotationX + "deg) rotateY(" + objRotationY + "deg) rotateZ(" + objRotationZ + "deg) translate3d(calc(" + anchorX + " + " + objX + "px), calc(" + anchorY + " + " + objY + "px), " + objZ + "px)";
	});
};

Morph.prototype.destroy = function(){
	this.anchors.forEach(function(v){
		if(!v) return;
		v.remove();
	});

	this.interactableObject.unset();
};

Morph.prototype.bind = function(morph){
	this.boundObjects.push(morph);
};

Morph.prototype.unboundAll = function(){
	this.boundObjects = [];
};

Morph.parseAnchorSyntax = function(statement, width, height){
	return statement
	.split(WIDTH).join(width + 'px')
	.split(WIDTH_HALF).join(Math.round(width / 2) + 'px')
	.split(HEIGHT).join(height + 'px')
	.split(HEIGHT_HALF).join(Math.round(height / 2) + 'px');
};

function ClickMorphWrapper(node, morphSpace, object, options){
	this.morph = {};
	this.node = node;
	this.morphSpace = morphSpace;
	this.object = object;

	this.compareAttrName = options.compareAttrName || 'id';
	this.create = options.create || function(){};
	this.destroy = options.destroy;
	this.remove = options.remove;
	this.logCallback = options.logCallback;

	var _this = this;

	node.addEventListener('click', function(evt){
		_this.generate();
		evt.stopPropagation();
		evt.preventDefault();
	});
}

ClickMorphWrapper.prototype.generate = function(noRegister){
	var _this = this;
	if(JSON.stringify(_this.morph) !== '{}') return;

	_this.morph = new Morph(_this.node, _this.morphSpace, false, function(){
		_this.remove();
	}, this.logCallback, this);
	_this.create(_this.morph);

	if(!noRegister){
		var handler = function(evt){
			if(
				!evt.target.classList.contains('os-morph-anchor')
				&& evt.target.getAttribute(_this.compareAttrName) !== _this.node.getAttribute(_this.compareAttrName)
				&& !(evt.target.parentNode && evt.target.parentNode.id === 'os-editor-property-editor')
				&& !(evt.target.parentNode && evt.target.parentNode.parentNode && evt.target.parentNode.parentNode.id === 'os-editor-property-editor')
			){
				//Mobile Fortress Destroyer
				_this.morph.destroy();
				_this.morph = {};
				_this.destroy();
				evt.preventDefault();
			}else window.addEventListener('click', handler, {
				once: true,
				capture: true
			});
		};

		//ClariS - CLICK
		window.addEventListener('click', handler, {
			once: true,
			capture: true
		});
	}
};

ClickMorphWrapper.prototype.regenerate = function(){
	this.morph.destroy();
	this.morph = {};
	this.destroy();
	this.generate(true);
};

ClickMorphWrapper.prototype.bindProperty = function(update){
	update = update || function(){};
	var _this = this;

	_this.node.addEventListener('os:update', function(){
		var morph = _this.morph;
		var node = _this.node;
		var object = _this.object;

		var changes = [];
		if(object.pos.x !== morph['os-x']){
			changes.push('os-x');
			object.pos.x = morph['os-x'];
		}

		if(object.pos.y !== morph['os-y']){
			changes.push('os-y');
			object.pos.y = morph['os-y'];
		}

		if(object.pos.z !== morph['os-z']){
			changes.push('os-z');
			object.pos.z = morph['os-z'];
		}

		if(object.rot.x !== morph['os-rotation-x']){
			changes.push('os-rotation-x');
			object.rot.x = morph['os-rotation-x'];
		}

		if(object.rot.y !== morph['os-rotation-y']){
			changes.push('os-rotation-y');
			object.rot.y = morph['os-rotation-y'];
		}

		if(object.rot.z !== morph['os-rotation-z']){
			changes.push('os-rotation-z');
			object.rot.z = morph['os-rotation-z'];
		}

		if(object.size.x !== morph['os-width']){
			changes.push('os-width');
			object.size.x = morph['os-width'];
		}

		if(object.size.y !== morph['os-height']){
			changes.push('os-height');
			object.size.y = morph['os-height'];
		}
		update(changes);
	});
};

Morph.ClickMorphWrapper = ClickMorphWrapper;

module.exports = Morph;
