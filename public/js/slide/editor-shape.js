var RICH_TEXT = 0;
var TYPE_RECTANGLE = 1;
var TYPE_IMAGE = 2;
var TYPE_VIDEO = 3;
var TYPE_HTML = 4;

function Shape(data, parentSlide){
	this.parent = parentSlide;
	this.workspace = parentSlide.workspace;
	var _this = this;
	['id', 'pos', 'rot', 'size', 'type', 'meta'].forEach(function(v){
		_this[v] = data[v];
	});
	this.elemType = 'shape';
	parentSlide.shapes[this.id] = this;
	this.init();
	this.morphGenerator = new morph.ClickMorphWrapper(this.node, this.parent.slideNode, this, {
		compareAttrName: 'data-os-shape-id',
		remove: function(){
			//TODO Removal
			_this.morph = undefined;
			_this.workspace.propertyEditor.bind(null);
		},
		destroy: function(){
			_this.morph = undefined;
			_this.workspace.propertyEditor.bind(null);
		},
		create: function(morph){
			_this.morph = morph;
			_this.workspace.propertyEditor.bind(_this, function(change){
				//TODO socket

				_this.onUpdate();
			});
		},
		logCallback: function(){
			var scale = _this.workspace.getWorkingSlideScale();
			if(scale === null) scale = 1;
			return scale;
		}
	});

	this.morphGenerator.bindProperty(function(changes){
		//TODO socket
		_this.workspace.propertyEditor.update();
		_this.onUpdate(changes);
	});

	parentSlide.slideNode.append(this.node);
}

var lastSent = 0;
Shape.prototype.onUpdate = function(changes){
	if(Date.now() - lastSent > 50 && Array.isArray(changes) && changes.length > 0){
		lastSent = Date.now();
		var data = {};

		var change;
		while(change = changes.pop()){
			switch(change){
				case 'os-x':
				case 'os-y':
					data.pos = {
						x: parseFloat(this.pos.x), y: parseFloat(this.pos.y)
					};
					break;
				case 'os-rotation-x':
				case 'os-rotation-y':
				case 'os-rotation-z':
					data.rot = {
						x: parseFloat(this.rot.x), y: parseFloat(this.rot.y), z: parseFloat(this.rot.z)
					};
					break;
				case 'os-width':
				case 'os-height':
					data.size = {
						x: parseFloat(this.size.x), y: parseFloat(this.size.y)
					};
					break;
			}
		}

		data.slide = this.parent.id;
		data.shape = this.id;
		socket.emit('update shape', {
			document: documentId,
			packets: [
				data
			]
		});
	}

	//TODO socket
	this.parent.onUpdate();
};

Shape.prototype.convertToHTMLShape = function(){
	this.type = TYPE_HTML;
	this.onUpdate();
};

function ImageShape(data, parentSlide){
	if(!data.meta) data.meta = {};
	if(!data.meta.src) data.meta.src = "http://placehold.it/500?text=Please+change+me";
	Shape.apply(this, arguments);
}

ImageShape.prototype = Object.create(Shape.prototype);
ImageShape.prototype.constructor = ImageShape;

ImageShape.prototype.init = function(){
	this.node = document.createElement('img');
	var _temp = new morph(this.node, this.parent.slideNode, false);
	_temp['os-x'] = this.pos.x;
	_temp['os-y'] = this.pos.y;
	_temp['os-z'] = 0;
	_temp['os-rotation-x'] = this.rot.x;
	_temp['os-rotation-y'] = this.rot.y;
	_temp['os-rotation-z'] = this.rot.z;
	_temp['os-width'] = this.size.x;
	_temp['os-height'] = this.size.y;
	_temp.updateNode();
	_temp.destroy();

	var _this = this;
	this.morph = undefined;
	this.node.setAttribute('data-os-shape-id', this.id);
	this.node.src = this.meta.src;

	this.onUpdate();
};

ImageShape.prototype.onEdit = function(){
	var _this = this;
	$('#os-editor-dialogs').style.display = 'flex';
	$('#os-editor-image-edit-dialog').style.display = 'block';
	$('#os-editor-image-src').value = _this.meta.src;
	$('#imgdialog-ok').onclick = function(){
		var preImg = document.createElement('img');
		preImg.src = $('#os-editor-image-src').value;
		preImg.onload = function(){
			if(_this.morph !== undefined && _this.morphGenerator.morph !== undefined){
				_this.morph['os-width'] = preImg.naturalWidth;
				_this.morph['os-height'] = preImg.naturalHeight;
				_this.morphGenerator.regenerate();
			}
			_this.node.setAttribute('data-os-width', preImg.naturalWidth);
			_this.node.setAttribute('data-os-height', preImg.naturalHeight);
			_this.node.style.width = preImg.naturalWidth + 'px';
			_this.node.style.height = preImg.naturalHeight + 'px';
			_this.size.x = preImg.naturalWidth;
			_this.size.y = preImg.naturalHeight;
			_this.meta.src = $('#os-editor-image-src').value;
			_this.onUpdate();
			$('#os-editor-dialogs').style.display = 'none';
			$('#os-editor-image-edit-dialog').style.display = 'none';
			$('#os-editor-image-src').value = '';
		};
	};

	$('#imgdialog-cancel').onclick = function(){
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-image-edit-dialog').style.display = 'none';
		$('#os-editor-image-src').value = '';
	};
};

ImageShape.prototype.onUpdate = function(){
	Shape.prototype.onUpdate.apply(this, arguments);
	this.node.src = this.meta.src;
};

ImageShape.createShape = function(shapeData, slide, emit){
	shapeData.type = TYPE_IMAGE;
	if(!shapeData.meta) shapeData.meta = {};
	if(!shapeData.meta.src) shapeData.meta.src = "http://placehold.it/500?text=Please+change+me";

	if(emit !== false){
		socket.emit('create shape', {
			document: documentId,
			slide: slide.id,
			pos: shapeData.pos,
			size: shapeData.size,
			meta: shapeData.meta,
			type: shapeData.type
		});
	}
};

socket.on('update shape', function(data){
	if(Array.isArray(data.packets)){
		data.packets.forEach(function(packet){
			if(!packet) return;

			var slide = window.currentWorkspace.document.slides[packet.slide];
			if(!slide) return;
			var shape = slide.shapes[packet.shape];
			if(!shape) return;

			if(typeof packet.size === 'object'
				&& typeof packet.size.x === 'number' && typeof packet.size.y === 'number'){
				shape.size = {
					x: packet.size.x, y: packet.size.y
				};
			}

			if(typeof packet.pos === 'object'
				&& typeof packet.pos.x === 'number' && typeof packet.pos.y === 'number'){
				shape.pos = {
					x: packet.pos.x, y: packet.pos.y
				};
			}

			if(typeof packet.rot === 'object'
				&& typeof packet.rot.x === 'number' && typeof packet.rot.y === 'number' && typeof packet.rot.z === 'number'){
				shape.rot = {
					x: packet.rot.x, y: packet.rot.y, z: packet.rot.z
				};
			}

			var node = shape.node;

			node.setAttribute('os-x', shape.pos.x);
			node.setAttribute('os-y', shape.pos.y);
			node.setAttribute('os-z', shape.pos.z);

			node.setAttribute('os-rotation-x', shape.rot.x);
			node.setAttribute('os-rotation-y', shape.rot.y);
			node.setAttribute('os-rotation-z', shape.rot.z);

			node.setAttribute('os-width', shape.size.x);
			node.setAttribute('os-height', shape.size.y);

			if(shape.morph){
				shape.morph['os-x'] = shape.pos.x;
				shape.morph['os-y'] = shape.pos.y;
				shape.morph['os-rotation-x'] = shape.rot.x;
				shape.morph['os-rotation-y'] = shape.rot.y;
				shape.morph['os-rotation-z'] = shape.rot.z;
				shape.morph['os-width'] = shape.size.x;
				shape.morph['os-height'] = shape.size.y;

				shape.morph.updateAnchor();
			}

			shape.workspace.propertyEditor.update();
			shape.onUpdate();
			console.log('yes shape update!');

			node.style.width = shape.size.x + 'px';
			node.style.height = shape.size.y + 'px';

			var centerX = shape.pos.x + Math.round(shape.size.x / 2);
			var centerY = shape.pos.y + Math.round(shape.size.y / 2);

			node.style.transformOrigin = node.style.webkitTransformOrigin = node.style.mozTransformOrigin = node.style.msTransformOrigin =
				centerX + 'px ' + centerY + 'px';
			node.style.transform = "rotateX(" + shape.rot.x + "deg) rotateY(" + shape.rot.y + "deg) rotateZ(" + shape.rot.z + "deg) translate3d(" + shape.pos.x + "px, " + shape.pos.y + "px, 0px)";
		});
	}
});

socket.on('create shape', function(data){
	var slide = window.currentWorkspace.document.slides[data.slide];
	if(!slide) return;

	data.id = data.shape;
	// TODO: 도형 타입으로 생성 도형 다르게 하기
	new ImageShape(data, slide);
});

Shape.ImageShape = ImageShape;
module.exports = Shape;
