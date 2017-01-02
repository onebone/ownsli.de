function Slide(data, workspace){
	this.workspace = workspace;
	var _this = this;
	this.shapes = {};
	['id', 'pos', 'rot', 'size', 'order', 'meta'].forEach(function(v){
		_this[v] = data[v];
	});

	this.type = 'slide';
	this.meta.background = this.meta.background || '#fff';

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
		remove: function(){
			//TODO Removal
			_this.workspace.propertyEditor.bind(null);
		},
		destroy: function(){
			_this.workspace.propertyEditor.bind(null);
		},
		create: function(morph){
			_this.morph = morph;
			_this.workspace.propertyEditor.bind(_this, function(change){
				//TODO socket
				_this.onUpdate();
			});
		}
	});

	this.morphGenerator.bindProperty(function(changes){
		//TODO socket
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


		_this.onUpdate(false);
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

var lastSent = 0;
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

		if(Date.now() - lastSent > 50 && Array.isArray(changes) && changes.length > 0){
			lastSent = Date.now();

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

		var wantedWidth = window.innerWidth - 420;
		var editRate = wantedWidth / this.size.x;
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
	if(Array.isArray(data.packets)){
		data.packets.forEach(function(packet){
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

			var node = slide.layoutNode;

			node.setAttribute('os-x', slide.pos.x);
			node.setAttribute('os-y', slide.pos.y);
			node.setAttribute('os-z', slide.pos.z);

			node.setAttribute('os-rotation-x', slide.rot.x);
			node.setAttribute('os-rotation-y', slide.rot.y);
			node.setAttribute('os-rotation-z', slide.rot.z);

			node.setAttribute('os-width', slide.size.x);
			node.setAttribute('os-height', slide.size.y);

			if(slide.morph){
				slide.morph['os-x'] = slide.pos.x;
				slide.morph['os-y'] = slide.pos.y;
				slide.morph['os-z'] = slide.pos.z;
				slide.morph['os-rotation-x'] = slide.rot.x;
				slide.morph['os-rotation-y'] = slide.rot.y;
				slide.morph['os-rotation-z'] = slide.rot.z;
				slide.morph['os-width'] = slide.size.x;
				slide.morph['os-height'] = slide.size.y;

				slide.morph.updateAnchor();
			}

			slide.workspace.propertyEditor.update();
			slide.onUpdate();
			console.log('yes update!');

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
	data.id = data.slide;
	new Slide(data, window.currentWorkspace);
});

module.exports = Slide;
