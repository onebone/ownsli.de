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
			var newOrder = {};
			Array.prototype.forEach.call($('#os-editor-slidelist').children, function(elem, index){
				var id = parseInt(elem.querySelector('.os-editor-slidelist-slide').getAttribute('data-os-slide-id'));
				_this.document.slides[id].order
					= index + 1;
				elem.querySelector('.os-editor-slidelist-indicator').innerText = index + 1;
				newOrder[index + 1] = id;
			});

			socket.emit('update order', {
				document: documentId,
				orders: newOrder
			});
		}
	});

	this.workingSlideId = undefined;
	this.morphSpace = $('#os-editor-layout');
	this.propertyEditor = new propertyEditor();
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

module.exports = Workspace;
