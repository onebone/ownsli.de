function Shape(data, parentSlide){
	this.parent = parentSlide;
	this.workspace = parentSlide.workspace;
	var _this = this;
	['id', 'pos', 'rot', 'size', 'type', 'meta'].forEach(function(v){
		_this[v] = data[v];
	});
	parentSlide.shapes[this.id] = this;
	this.init();
}

Shape.prototype.convertToHTMLShape = function(){
	this.type = 'html';
	this.onUpdate();
};

function ImageShape(data, parentSlide){
	Shape.apply(this, arguments);
	if(!this.meta.src) this.meta.src = "http://placehold.it/500?text=Please+change+me";
}

ImageShape.prototype = Object.create(Shape.prototype);
ImageShape.prototype.constructor = ImageShape;

ImageShape.prototype.init = function(){
	this.node = document.createElement('img');
	var _temp = new morph(this.node, this.workspace.morphSpace, false);
	_temp['os-x'] = this.pos.x;
	_temp['os-y'] = this.pos.y;
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

	morph.clickMorph(this.node, this.workspace.morphSpace, this, {
		compareAttrName: 'data-os-shape-id',
		update: function(changes){
			//TODO send packet
			_this.onUpdate();
		},
		remove: function(){
			//TODO removal
		}
	});
	this.onUpdate();
};

ImageShape.prototype.onEdit = function(){

};

ImageShape.prototype.onUpdate = function(){
	this.parent.onUpdate();
};
