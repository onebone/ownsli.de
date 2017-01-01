var isInitFinished = true;

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
		_this.onUpdate();
	});
}

Slide.createSlide = function(slideData, shapes, workspace, cb){
	if(!cb) cb = function(){};

	if(!isInitFinished){
		//To prevent slide id is jammed
		setTimeout(function(){
			Slide.createSlide.apply(this, arguments);
		}, 1000);
		return;
	}

	isInitFinished = false;
	socket.once('create slide', function(data){
		slideData.id = data.slide;
		var _this = new Slide(slideData, shapes, workspace);
		isInitFinished = true;

		cb(_this);
	});

	socket.emit('create slide', {
		document: documentId,
		pos: slideData.pos,
		size: slideData.size,
		order: slideData.order,
		meta: slideData.meta
	});
};

Slide.prototype.setEditableSlide = function(node){
	this.slideNode = node;
};

Slide.prototype.setSlidePreview = function(node){
	var indicator = document.createElement('span');
	indicator.classList.add('os-editor-slidelist-indicator');
	indicator.innerText = this.order;

	this.previewWrapper = document.createElement('div');
	this.previewWrapper.classList.add('os-editor-slidelist-wrapper')
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

Slide.prototype.onUpdate = function(){
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

module.exports = Slide;
