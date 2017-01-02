var TYPE_TEXT = 0;
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
	this.morph = undefined;
	this.node.setAttribute('data-os-shape-id', this.id);
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
		_this.onUpdate();
	});

	parentSlide.slideNode.append(this.node);
}

Shape.prototype.onUpdate = function(){
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
	this.node.src = this.meta.src;
	Shape.prototype.onUpdate.apply(this, arguments);
};

ImageShape.createShape = function(shapeData, slide, emit){
	shapeData.type = TYPE_IMAGE;
	if(!shapeData.meta) shapeData.meta = {};
	if(!shapeData.meta.src) shapeData.meta.src = "/img/image-placeholder.png";

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

function TextShape(data, parentSlide){
	if(!data.meta) data.meta = {};
	if(!data.meta.html) data.meta.html = '<span style="font-size: 36pt;">Hello, World!</span>';
	Shape.apply(this, arguments);
}

TextShape.prototype = Object.create(Shape.prototype);
TextShape.prototype.constructor = TextShape;

TextShape.prototype.init = function(){
	this.node = document.createElement('p');
	this.node.innerHTML = this.meta.html;

	this.onUpdate();
};

TextShape.prototype.onEdit = function(){
	var _this = this;
	$('#os-editor-dialogs').style.display = 'flex';
	$('#os-editor-text-edit-dialog').style.display = 'block';
	tinymce.activeEditor.setContent(this.meta.html);

	$('#txtdialog-ok').onclick = function(){
		_this.meta.html = tinymce.activeEditor.getContent();
		_this.onUpdate();
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-text-edit-dialog').style.display = 'none';
		tinymce.activeEditor.setContent('');
	};

	$('#txtdialog-cancel').onclick = function(){
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-text-edit-dialog').style.display = 'none';
		tinymce.activeEditor.setContent('');
	};
};

TextShape.prototype.onUpdate = function(){
	this.node.innerHTML = this.meta.html;
	Shape.prototype.onUpdate.apply(this, arguments);
};

TextShape.createShape = function(shapeData, slide, emit){
	shapeData.type = TYPE_TEXT;
	if(!shapeData.meta) shapeData.meta = {};
	if(!shapeData.meta.html) shapeData.meta.html = '<span style="font-size: 36pt;">Hello, World!</span>';

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

function VideoShape(data, parentSlide){
	if(!data.meta) data.meta = {};
	if(!data.meta.src) data.meta.src = "/video/video-placeholder.mp4";
	if(!data.meta.source) data.meta.source = "raw";
	Shape.apply(this, arguments);
}

VideoShape.prototype = Object.create(Shape.prototype);
VideoShape.prototype.constructor = VideoShape;

VideoShape.prototype.init = function(){
	this.node = document.createElement('div');

	this.onUpdate();
};

VideoShape.prototype.onEdit = function(){
	var _this = this;
	$('#os-editor-dialogs').style.display = 'flex';
	$('#os-editor-video-edit-dialog').style.display = 'block';
	if(this.meta.source === 'raw'){
		$('#os-editor-video-src-raw').value = this.meta.src;
		$('#os-editor-video-src-youtube').value = '';
	}else{
		$('#os-editor-video-src-raw').value = '';
		$('#os-editor-video-src-youtube').value = this.meta.youtube;
	}

	$('#viddialog-ok').onclick = function(){1
		var setSize = function(x, y){
			if(_this.morph !== undefined && _this.morphGenerator.morph !== undefined){
				_this.morph['os-width'] = x;
				_this.morph['os-height'] = y;
				_this.morphGenerator.regenerate();
			}
			_this.node.setAttribute('data-os-width', x);
			_this.node.setAttribute('data-os-height', y);
			_this.node.style.width = x + 'px';
			_this.node.style.height = y + 'px';
			_this.size.x = x;
			_this.size.y = y;
		};

		if($('#os-editor-video-src-youtube').value){
			_this.meta.youtube = $('#os-editor-video-src-youtube').value;
			_this.meta.src = '';
			_this.meta.source = 'youtube';
			setSize(640, 360);
			_this.onUpdate();
			$('#os-editor-dialogs').style.display = 'none';
			$('#os-editor-video-edit-dialog').style.display = 'none';
			$('#os-editor-video-src-raw').value = '';
			$('#os-editor-video-src-youtube').value = '';
		}else{
			_this.meta.src = $('#os-editor-video-src-raw').value;
			_this.meta.youtube = '';
			_this.meta.source = 'raw';
			var preVid = document.createElement('video');
			preVid.src = _this.meta.src;
			preVid.addEventListener( "loadedmetadata", function (){
			    setSize(this.videoWidth, this.videoHeight);
				_this.onUpdate();
				$('#os-editor-dialogs').style.display = 'none';
				$('#os-editor-video-edit-dialog').style.display = 'none';
				$('#os-editor-video-src-raw').value = '';
				$('#os-editor-video-src-youtube').value = '';
			}, false );
		}
	};

	$('#viddialog-cancel').onclick = function(){
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-video-edit-dialog').style.display = 'none';
		$('#os-editor-video-src-raw').value = '';
		$('#os-editor-video-src-youtube').value = '';
	};
};

VideoShape.prototype.onUpdate = function(){
	//Python-style javascript
	if(this.meta.source === 'raw')																	{
		this.vnode = document.createElement('video');
		this.vnode.setAttribute('controls', '');
		this.vnode.src = this.meta.src;																}
	else																							{
		this.vnode = document.createElement('iframe');
		this.vnode.src = 'https://www.youtube-nocookie.com/embed/' + this.meta.youtube + '?rel=0';
		this.vnode.setAttribute('frameborder', 0);
		this.vnode.setAttribute('allowfullscreen', '');
		this.vnode.setAttribute('width', '640');
		this.vnode.setAttribute('height', '360');
		this.vnode.style.pointerEvents = 'none';													}

	//It's so beautiful!!!

	this.vnode.style.width = this.size.x + 'px';
	this.vnode.style.height = this.size.y + 'px';
	this.node.innerHTML = '';
	this.node.append(this.vnode);
	Shape.prototype.onUpdate.apply(this, arguments);
};

VideoShape.createShape = function(shapeData, slide, emit){
	shapeData.type = TYPE_VIDEO;
	if(!shapeData.meta) shapeData.meta = {};
	if(!shapeData.meta.source) shapeData.meta.source = 'raw';
	if(!shapeData.meta.src) shapeData.meta.src = "/video/video-placeholder.mp4";

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

function RectangleShape(data, parentSlide){
	if(!data.meta) data.meta = {};
	if(!data.meta.color) data.meta.color = "#ff5722";
	if(!data.meta.type) data.meta.type = 'rectangle';
	Shape.apply(this, arguments);
}

RectangleShape.prototype = Object.create(Shape.prototype);
RectangleShape.prototype.constructor = RectangleShape;

RectangleShape.prototype.init = function(){
	this.node = document.createElement('div');

	this.onUpdate();
};

RectangleShape.prototype.onEdit = function(){
	var _this = this;
	$('#os-editor-dialogs').style.display = 'flex';
	$('#os-editor-shape-edit-dialog').style.display = 'block';

	$('#os-editor-shape-type').value = this.meta.type;
	$('#os-editor-shape-color').value = this.meta.color;

	$('#shpdialog-ok').onclick = function(){
		_this.meta.type = $('#os-editor-shape-type').value;
		_this.meta.color = $('#os-editor-shape-color').value;

		_this.onUpdate();
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-image-edit-dialog').style.display = 'none';
		$('#os-editor-shape-type').value = 'rectangle';
		$('#os-editor-shape-color').value = '';
	};

	$('#shpdialog-cancel').onclick = function(){
		$('#os-editor-dialogs').style.display = 'none';
		$('#os-editor-image-edit-dialog').style.display = 'none';
		$('#os-editor-shape-type').value = 'rectangle';
		$('#os-editor-shape-color').value = '';
	};
};

RectangleShape.prototype.onUpdate = function(){
	if(this.meta.type === 'rectangle'){
		this.node.style.borderRadius = '0';
	}else {
		this.node.style.borderRadius = '50%';
	}

	this.node.style.background = this.meta.color;
	Shape.prototype.onUpdate.apply(this, arguments);
};

RectangleShape.createShape = function(shapeData, slide, emit){
	shapeData.type = TYPE_RECTANGLE;
	if(!shapeData.meta) shapeData.meta = {};
	if(!shapeData.meta.type) shapeData.meta.type = 'rectangle';
	if(!shapeData.meta.color) shapeData.meta.color = '#ff5722';

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

socket.on('create shape', function(data){
	var slide = window.currentWorkspace.document.slides[data.slide];
	if(!slide) return;

	Shape.fromType(data, slide);
});

Shape.ImageShape = ImageShape;
Shape.TextShape = TextShape;
Shape.VideoShape = VideoShape;
Shape.RectangleShape = RectangleShape;
Shape.fromType = function(data, slide){
	if(data.id === undefined && data.slide !== undefined) data.id = data.shape;

	switch(data.type){
		case TYPE_IMAGE:
			return new ImageShape(data, slide);

		case TYPE_TEXT:
			return new TextShape(data, slide);

		case TYPE_VIDEO:
			return new VideoShape(data, slide);

		case TYPE_RECTANGLE:
			return new RectangleShape(data, slide);

		default:
			alert('Unknown data type from server!');
			console.log(data);
	}
};

module.exports = Shape;
