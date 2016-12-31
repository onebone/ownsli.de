var SCALE_REGEX = /scale\s*\(([0-9.]+)\)/;

function Workspace(slideRoot, workspaceRoot){
	this.root = slideRoot;
	this.workspaceRoot = workspaceRoot;
	this.document = {
		slides: {}
	};

	Sortable.create($('#os-editor-slidelist'), {
		onUpdate: function(evt){
			//TODO socket emit swap order
		}
	});

	this.workingSlideId = undefined;
	this.morphSpace = $('#os-editor-layout');
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
	var workingSlide = this.getWorkingSlide();
	if(!workingSlide) return;
	if(!workingSlide.slideNode) return;

	var transform = workingSlide.slideNode.style.transform;
	if(!transform) return;

	var scaleMatch = transform.match(SCALE_REGEX);
	if(!scaleMatch) return;

	var scale = parseFloat(scaleMatch[1]);
	if(!isFinite(scale)) return;

	if(amount < 0){
		workingSlide.slideNode.style.transform = 'scale(' + (scale + 0.5) + ')';
	}else workingSlide.slideNode.style.transform = 'scale(' + (scale - 0.5) + ')';
};

//Misaka 20001
Workspace.prototype.lastOrder = function(){
	var _this = this;
	return Object.keys(this.document.slides).map(function(v){
		return _this.document.slides[v];
	}).reduce(function(prev, curr){
		if(prev < curr.order) return curr.order;
	}, 0) + 1;
};

Workspace.prototype.bindWithPropertyEditor = function(element){
	//if(element instanceof slide){
	if(element.type === 'slide'){

	}
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
