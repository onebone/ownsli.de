var isInitFinished = true;

function Slide(data, workspace){
	this.workspace = workspace;
	var _this = this;
	['id', 'pos', 'rot', 'size'].forEach(function(v){
		_this[v] = data[v];
	});
}

Slide.prototype.initSlide = function(node){
	var _this = this;
	if(!isInitFinished){
		//To prevent slide id is jammed
		setTimeout(function(){
			_this.initSlide();
		}, 1000);
		return;
	}

	isInitFinished = false;
	socket.once('create slide', function(data){
		_this.id = data.slide;
		isInitFinished = true;

		var slideNode = document.createElement('div');
		slideNode.setAttribute('data-os-slide-id', _this.id);
		_this.setEditableSlide(slideNode);

		var previewNode = document.createElement('div');
		previewNode.setAttribute('data-os-slide-id', _this.id);
		_this.setSlidePreview(previewNode);

		var layoutNode = document.createElement('div');
		layoutNode.classList.add('os-editor-layout-slide');
		layoutNode.innerHTML = `#${_this.id}`;
		_this.setSlideLayout(layoutNode);
	});

	socket.emit('create slide', {
		document: documentId
	});
};

Slide.prototype.setEditableSlide = function(node){
	this.slideNode = node;
};

Slide.prototype.setSlidePreview = function(node){
	this.previewNode = node;
};

Slide.prototype.setSlideLayout = function (node){
	var this = _this;
	this.layoutNode = node;
	this.layoutNode.addEventListener('click', function(){
		var layoutMorph = new morph(node, this.workspace, false, function(){
			//TODO Removal
		});

		layoutMorph.addEventListener('os:update', function(){
			_this.pos.x = layoutMorph['os-x'];
			_this.pos.y = layoutMorph['os-y'];
			_this.pos.z = layoutMorph['os-z'];
			_this.rot.x = layoutMorph['os-rotation-x'];
			_this.rot.y = layoutMorph['os-rotation-y'];
			_this.rot.z = layoutMorph['os-rotation-z'];
			_this.size.x = layoutMorph['os-width'];
			_this.size.y = layoutMorph['os-height'];
			_this.onUpdate();
		});

		window.addEventListener('click', function(){
			layoutMorph.destroy();
		}, {once: true});
	});
	
	$('#os-editor-layout').append(node);
};

Slide.prototype.onUpdate = function(){

};

Slide.prototype.toExportableData = function(){
	return {
		id: this.id,
		pos: this.pos,
		rot: this.rot,
		size: this.size
	};
};

module.exports = Slide;
