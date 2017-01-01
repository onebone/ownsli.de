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
			_this.workspace.propertyEditor.bind(null);
		},
		destroy: function(){
			_this.workspace.propertyEditor.bind(null);
		},
		create: function(morph){
			_this.morph = morph;
			console.log(morph);
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
		_this.onUpdate();
	});

	parentSlide.slideNode.append(this.node);
}

Shape.prototype.convertToHTMLShape = function(){
	this.type = 'html';
	this.onUpdate();
};
var isInitFinished = true;

function ImageShape(data, parentSlide){
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
	$('#os-editor-image-edit-dialog').style.display = 'block';
};

ImageShape.prototype.onUpdate = function(){
	this.parent.onUpdate();
};

ImageShape.createShape = function(shapeData, slide, cb){
	if(!cb) cb = function(){};

	if(!isInitFinished){
		//To prevent shape id is jammed
		setTimeout(function(){
			ImageShape.createShape.apply(this, arguments);
		}, 1000);
		return;
	}

	isInitFinished = false;
	shapeData.type = TYPE_IMAGE;
	if(!shapeData.meta.src) shapeData.meta.src = "http://placehold.it/500?text=Please+change+me";
	socket.once('create shape', function(data){
		shapeData.id = data.shape;
		var _this = new ImageShape(shapeData, slide);
		isInitFinished = true;
		cb(_this);
	});

	socket.emit('create shape', {
		document: documentId,
		slide: slide.id,
		pos: shapeData.pos,
		size: shapeData.size,
		meta: shapeData.meta,
		type: shapeData.type
	});
};

Shape.ImageShape = ImageShape;
module.exports = Shape;
