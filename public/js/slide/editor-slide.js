function Slide(data, workspace){
	this.workspace = workspace;
	var _this = this;
	this.shapes = {};
	['id', 'pos', 'rot', 'size', 'order', 'meta'].forEach(function(v){
		_this[v] = data[v];
	});

	this.type = 'slide';
	this.meta.background = this.meta.background || '#fff';
	this.meta.note = this.meta.note || '';

	this.workspace.document.slides[this.id] = this;

	var slideNode = document.createElement('div');
	slideNode.setAttribute('data-os-slide-id', _this.id);
	_this.setEditableSlide(slideNode);

	var previewNode = document.createElement('div');
	previewNode.classList.add('os-editor-slidelist-slide');
	previewNode.setAttribute('data-os-slide-id', _this.id);
	_this.setSlidePreview(previewNode);

	var layoutNode = document.createElement('div');
	layoutNode.classList.add('os-editor-layout-slide');
	layoutNode.setAttribute('data-os-slide-id', _this.id);
	layoutNode.innerHTML = '#' + _this.order;
	_this.setSlideLayout(layoutNode);

	this.morphGenerator = new morph.ClickMorphWrapper(this.layoutNode, this.workspace.morphSpace, this, {
		compareAttrName: 'data-os-slide-id',
		logCallback: function(){
			return _this.workspace.getLayoutScale();
		},
		remove: function(){
			var _key = Object.keys(_this.workspace.document.slides);
			if(_key[0] === _this.id) _key.shift();
			if(_key.length === 0) return alert('Cannot delete last slide!');

			if(_this.workspace.workingSlideId === _this.id) _this.workspace.setWorkingSlide(_key[0]);
			socket.emit('delete slide', {
				document: documentId,
				slide: _this.id
			});
		},
		destroy: function(){
			_this.workspace.propertyEditor.bind(null);
		},
		create: function(morph){
			_this.morph = morph;
			_this.workspace.propertyEditor.bind(_this, function(change){
				_this.onUpdate();
			});
		}
	});

	this.morphGenerator.bindProperty(function(changes){
		_this.workspace.propertyEditor.update();
		_this.onUpdate(changes);
	});

	socket.on('update slide', function(data){
		if(typeof data.size === 'object'
			&& typeof data.size.x === 'number' && typeof data.size.y === 'number'&& typeof data.size.z === 'number'){
			this.size = {
				x: data.size.x,
				y: data.size.y,
				z: data.size.z
			};
		}

		if(typeof data.pos === 'object'
			&& typeof data.pos.x === 'number' && typeof data.pos.y === 'number' && typeof data.pos.z === 'number'){
			this.pos = {
				x: data.pos.x,
				y: data.pos.y,
				z: data.pos.z
			};
		}

		if(typeof data.rot === 'object'
			&& typeof data.rot.x === 'number' && typeof data.rot.y === 'number' && typeof data.rot.z === 'number'){
			this.rot = {
				x: data.rot.x,
				y: data.rot.y,
				z: data.rot.z
			};
		}

		_this.onUpdate();
		//console.log(data);
	});
}

Slide.createSlide = function(slideData, workspace, emit){
	if(slideData.id !== undefined && Object.keys(workspace.document.slides).map(function(key){
		return parseInt(key);
	}).indexOf(slideData.id) !== -1) return console.log('aa');

	if(emit !== false){
		socket.emit('create slide', {
			document: documentId,
			pos: slideData.pos,
			size: slideData.size,
			order: slideData.order,
			meta: slideData.meta
		});
	}
};

Slide.prototype.setEditableSlide = function(node){
	this.slideNode = node;
};

Slide.prototype.setSlidePreview = function(node){
	var indicator = document.createElement('span');
	indicator.classList.add('os-editor-slidelist-indicator');
	indicator.innerText = this.order;

	this.previewWrapper = document.createElement('div');
	this.previewWrapper.classList.add('os-editor-slidelist-wrapper');
	this.previewNode = node;
	this.previewWrapper.append(indicator);
	this.previewWrapper.append(this.previewNode);

	$('#os-editor-slidelist').append(this.previewWrapper);
	this.onUpdate();
};

Slide.prototype.setSlideLayout = function(node){
	var _this = this;
	this.layoutNode = node;
	var _temp = new morph(node, this.workspace.morphSpace, false);
	_temp['os-x'] = _this.pos.x;
	_temp['os-y'] = _this.pos.y;
	_temp['os-z'] = _this.pos.z;
	_temp['os-rotation-x'] = _this.rot.x;
	_temp['os-rotation-y'] = _this.rot.y;
	_temp['os-rotation-z'] = _this.rot.z;
	_temp['os-width'] = _this.size.x;
	_temp['os-height'] = _this.size.y;
	_temp.updateNode();
	_temp.destroy();

	$('#os-editor-layout').append(node);
};

Slide.prototype.onUpdate = function(changes){
	if(this.previewNode && this.slideNode){
		var baseSize = this.size.x;
		if(this.size.x < this.size.y) baseSize = this.size.y;

		var resizeRate = 100 / baseSize;
		if(!isFinite(resizeRate)) resizeRate = 0;
		if(resizeRate < 0) resizeRate = Math.abs(resizeRate);

		var _this = this;
		this.previewWrapper.querySelector('.os-editor-slidelist-indicator').innerText = this.order;
		this.previewWrapper.addEventListener('click', function(){
			_this.workspace.setWorkingSlide(_this.id);
		});

		this.slideNode.style.width = this.size.x + 'px';
		this.slideNode.style.height = this.size.y + 'px';
		this.slideNode.style.background = this.meta.background;
		this.previewNode.style.width = this.size.x + 'px';
		this.previewNode.style.height = this.size.y + 'px';
		this.previewNode.style.background = this.meta.background;
		this.previewNode.style.transform = "scale(" + resizeRate + ")";
		this.previewNode.innerHTML = this.slideNode.innerHTML;

		if(Array.isArray(changes) && changes.length > 0){
			var data = {};

			var change;
			while(change = changes.pop()){
				switch(change){
					case 'os-x':
					case 'os-y':
					case 'os-z':
						data.pos = {
							x: parseFloat(_this.pos.x), y: parseFloat(_this.pos.y), z: parseFloat(_this.pos.z)
						};
						break;
					case 'os-rotation-x':
					case 'os-rotation-y':
					case 'os-rotation-z':
						data.rot = {
							x: parseFloat(_this.rot.x), y: parseFloat(_this.rot.y), z: parseFloat(_this.rot.z)
						};
						break;
					case 'os-width':
					case 'os-height':
						data.size = {
							x: parseFloat(_this.size.x), y: parseFloat(_this.size.y)
						};
						break;
					case 'meta':
						data.meta = _this.meta;
				}
			}

			data.slide = this.id;
			socket.emit('update slide', {
				document: documentId,
				packets: [
					data
				]
			});
		}

		var editRate = 1;
		var wantedWidth = window.innerWidth - 420;
		var wantedHeight = window.innerHeight - 50;
		if(wantedWidth - this.size.x > wantedHeight - this.size.y){
			//Fit to height
			editRate = wantedHeight / this.size.y;
		}else{
			//Fit to width
			editRate = wantedWidth / this.size.y;
		}
		if(!isFinite(editRate)) editRate = 1;
		if(editRate < 0) editRate = Math.abs(editRate);

		this.slideNode.style.transform = "scale(" + editRate + ")";
		this.slideNode.style.transformOrigin = "0 0";
	}

	if(this.layoutNode){
		this.layoutNode.innerText = '#' + this.order;
	}
};

Slide.prototype.toExportableData = function(){
	return {
		id: this.id,
		pos: this.pos,
		rot: this.rot,
		size: this.size,
		order: this.order,
		meta: this.meta
	};
};

socket.on('update slide', function(data){
	if(typeof data === 'object' && Array.isArray(data.packets)){
		data.packets.forEach(function(packet){
			if(!packet) return console.log('aa'); //FIXME packet is null
			var slide = window.currentWorkspace.document.slides[packet.slide];
			if(!slide) return console.log('aa');

			if(typeof packet.size === 'object'
				&& typeof packet.size.x === 'number' && typeof packet.size.y === 'number'){
				slide.size = {
					x: packet.size.x, y: packet.size.y
				};
			}

			if(typeof packet.pos === 'object'
				&& typeof packet.pos.x === 'number' && typeof packet.pos.y === 'number' && typeof packet.pos.z === 'number'){
				slide.pos = {
					x: packet.pos.x, y: packet.pos.y, z: packet.pos.z
				};
			}

			if(typeof packet.rot === 'object'
				&& typeof packet.rot.x === 'number' && typeof packet.rot.y === 'number' && typeof packet.rot.z === 'number'){
				slide.rot = {
					x: packet.rot.x, y: packet.rot.y, z: packet.rot.z
				};
			}

			if(typeof packet.meta === 'object'){
				slide.meta = packet.meta;
			}

			var node = slide.layoutNode;

			node.setAttribute('data-os-x', slide.pos.x);
			node.setAttribute('data-os-y', slide.pos.y);
			node.setAttribute('data-os-z', slide.pos.z);

			node.setAttribute('data-os-rotation-x', slide.rot.x);
			node.setAttribute('data-os-rotation-y', slide.rot.y);
			node.setAttribute('data-os-rotation-z', slide.rot.z);

			node.setAttribute('data-os-width', slide.size.x);
			node.setAttribute('data-os-height', slide.size.y);

			if(slide.morph){
				slide.morph['os-x'] = slide.pos.x;
				slide.morph['os-y'] = slide.pos.y;
				slide.morph['os-z'] = slide.pos.z;
				slide.morph['os-rotation-x'] = slide.rot.x;
				slide.morph['os-rotation-y'] = slide.rot.y;
				slide.morph['os-rotation-z'] = slide.rot.z;
				slide.morph['os-width'] = slide.size.x;
				slide.morph['os-height'] = slide.size.y;

				slide.morph.updateNode();
			}

			slide.workspace.propertyEditor.update();
			slide.onUpdate();

			node.style.width = slide.size.x + 'px';
			node.style.height = slide.size.y + 'px';

			var centerX = slide.pos.x + Math.round(slide.size.x / 2);
			var centerY = slide.pos.y + Math.round(slide.size.y / 2);

			node.style.transformOrigin = node.style.webkitTransformOrigin = node.style.mozTransformOrigin = node.style.msTransformOrigin =
				centerX + 'px ' + centerY + 'px';
			node.style.transform = "rotateX(" + slide.rot.x + "deg) rotateY(" + slide.rot.y + "deg) rotateZ(" + slide.rot.z + "deg) translate3d(" + slide.pos.x + "px, " + slide.pos.y + "px, " + slide.pos.z + "px)";

		});
	}
});

socket.on('create slide', function(data){
	if(typeof data !== 'object') return;

	data.id = data.slide;
	new Slide(data, window.currentWorkspace);

	if(Array.isArray(data.shapes)){
		var slide = window.currentWorkspace.document.slides[data.slide];
		if(!slide) return;

		data.shapes.forEach(function(data){
			shape.fromType(data, slide);
		});
	}
});

socket.on('delete slide', function(data){
	if(typeof data !== 'object') return;

	if(window.currentWorkspace.document.slides[data.slide]){
		var slide = window.currentWorkspace.document.slides[data.slide];
		if(slide.slideNode.remove) slide.slideNode.remove();
		if(slide.morphGenerator && slide.morphGenerator.morph && slide.morphGenerator.morph.destroy)
			slide.morphGenerator.morph.destroy();

		slide.layoutNode.remove();
		slide.previewNode.parentNode.remove();

		delete slide.workspace.document.slides[data.slide];
		slide.workspace.propertyEditor.bind(null);
	}
});

module.exports = Slide;
