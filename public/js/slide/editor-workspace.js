var SCALE_REGEX = /scale\s*\(([0-9.]+)\)/;

function Workspace(slideRoot, workspaceRoot){
	this.root = slideRoot;
	this.workspaceRoot = workspaceRoot;
	this.document = {
		slides: {},
		meta: {}
	};

	var _this = this;
	Sortable.create($('#os-editor-slidelist'), {
		onUpdate: function(evt){
			var changedId = evt.item.querySelector('.os-editor-slidelist-slide').getAttribute('data-os-slide-id');
			var changedOrder = Array.prototype.indexOf.call($('#os-editor-slidelist').childNodes, evt.item) + 1;

			var send = {
				document: documentId,
				orders: {}
			};
			send.orders[changedId] = changedOrder;
			socket.emit('update order', send);
		}
	});

	this.workingSlideId = undefined;
	this.morphSpace = $('#os-editor-layout');
	this.propertyEditor = new propertyEditor();
	this._isLayoutEditing = false;
}

Workspace.prototype.setWorkingSlide = function(id){
	if(!this.document.slides[id]) throw new Error("No such slide!");
	//TODO resize

	var newSlide = this.document.slides[id];
	var oldSlide = this.document.slides[this.workingSlideId];
	if(this.workingSlideId !== undefined){
		$('#os-editor-workspace').replaceChild(
			newSlide.slideNode,
			oldSlide.slideNode
		);

		if(oldSlide.previewWrapper) oldSlide.previewWrapper.classList.remove('os-editor-preview-active');
	}else{
		$('#os-editor-workspace').append(newSlide.slideNode);
	}

	if(newSlide.previewWrapper){
		newSlide.previewWrapper.classList.add('os-editor-preview-active');
	}

	this.workingSlideId = id;

	window.currentSelected = this.document.slides[id]; // current selected slide
};

//WORKING!!
Workspace.prototype.getWorkingSlide = function(){
	if(!this.document.slides[this.workingSlideId]) return null;

	return this.document.slides[this.workingSlideId];
};

Workspace.prototype.resize = function(amount){
	var scale = this.getWorkingSlideScale();
	if(scale === null) return;

	var workingSlide = this.getWorkingSlide();

	if(amount < 0){
		workingSlide.slideNode.style.transform = 'scale(' + (Math.min(10000, scale + 0.5)) + ')';
	}else workingSlide.slideNode.style.transform = 'scale(' + (Math.max(0.0001, scale - 0.5)) + ')';
};

Workspace.prototype.getWorkingSlideScale = function(){
	var workingSlide = this.getWorkingSlide();
	if(!workingSlide) return null;
	if(!workingSlide.slideNode) return null;

	var transform = workingSlide.slideNode.style.transform;
	if(!transform) return null;

	var scaleMatch = transform.match(SCALE_REGEX);
	if(!scaleMatch) return null;

	var scale = parseFloat(scaleMatch[1]);
	if(!isFinite(scale)) return null;

	return scale;
};

Workspace.prototype.isLayoutEditing = function(){
	return this._isLayoutEditing;
};

Workspace.prototype.setLayoutEditing = function(value){
	this._isLayoutEditing = value;
};

Workspace.prototype.getLayoutScale = function(){
	var transform = $('#os-editor-layout').style.transform;
	if(!transform) return null;

	var scaleMatch = transform.match(SCALE_REGEX);
	if(!scaleMatch) return null;

	var scale = parseFloat(scaleMatch[1]);
	if(!isFinite(scale)) return null;

	return scale;
};

var WRAPPER_WIDTH = 1000;
var WRAPPER_HEIGHT = 1000;
Workspace.prototype.resizeLayout = function(amount){
	var scale = this.getLayoutScale();
	if(scale === null) return;

	if(amount < 0) scale = Math.min(1000, scale + 0.05);
	else scale = Math.max(0.0001, scale - 0.05);

	$('#os-editor-layout').style.transform = 'scale(' + scale + ')';

	var margin = -5000 / 2 * (1 - scale);
	$('#os-editor-layout').style.top = (margin + (WRAPPER_HEIGHT / 2 - scale * 2500)) + 'px';
	$('#os-editor-layout').style.left = (margin + (WRAPPER_WIDTH / 2 - scale * 2500)) + 'px';
};

//Misaka 20001
Workspace.prototype.lastOrder = function(){
	var _this = this;
	return Object.keys(this.document.slides).map(function(v){
		return _this.document.slides[v];
	}).reduce(function(prev, curr){
		if(prev < curr.order) return curr.order;
		return prev;
	}, 0) + 1;
};

Workspace.prototype.deleteSlide = function(id){
	if(Object.keys(this.document.slides).length === 1){
		$('#os-editor-workspace').innerHTML = '';
	}else setWorkingSlide(this.document.slides[0]);
	//TODO delete slide
};

Workspace.prototype.addToWorkspace = function(node){
	this.workspaceRoot.append(node);
};

socket.on('update order', function(data){
	if(typeof data.orders !== 'object') return;

	Object.keys(data.orders).sort(function(v1, v2){
		return data.orders[v1] - data.orders[v2];
	}).forEach(function(k){
		$('#os-editor-slidelist').appendChild($('#os-editor-slidelist').querySelector('*[data-os-slide-id="' + k + '"]').parentNode);
		$('#os-editor-slidelist').querySelector('*[data-os-slide-id="' + k + '"]').parentNode.querySelector('.os-editor-slidelist-indicator').innerText =  data.orders[k];
	});
});

module.exports = Workspace;
