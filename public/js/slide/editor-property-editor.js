var MAPPING = {
	'#posx': ['pos.x', 'os-x'],
	'#posy': ['pos.y', 'os-y'],
	'#posz': ['pos.z', 'os-z'],
	'#rotx': ['rot.x', 'os-rotation-x'],
	'#roty': ['rot.y', 'os-rotation-y'],
	'#rotz': ['rot.z', 'os-rotation-z'],
	'#sizex': ['size.x', 'os-width'],
	'#sizey': ['size.y', 'os-height']
};

function PropertyEditor(){
	this.node = $('#os-editor-property-editor');
}

PropertyEditor.prototype.bind = function(element, update){
	this.elem = element;
	this.updateCallback = update || function(){};

	var _this = this;
	if(element && element.type === 'slide'){
		this.node.setAttribute('data-os-property-editor-type', 'slide');
		this.node.querySelector('h3').innerText = "#" + element.order;
	}else if(element && element.elemType === 'shape'){
		this.node.setAttribute('data-os-property-editor-type', 'shape');
		this.node.querySelector('button').onclick = function(){
			_this.elem.onEdit();
		};
	}else{
		this.node.setAttribute('data-os-property-editor-type', 'null');
		this.node.querySelector('h3').innerText = '';
		Object.keys(MAPPING).forEach(function(v){
			$(v).value = '';
		});
		Materialize.updateTextFields();
		return;
	}

	Object.keys(MAPPING).forEach(function(v){
		var value = MAPPING[v][0].split('.');

		$(v).onchange = function(){
			_this.elem[value[0]][value[1]] = parseInt($(v).value);
			_this.elem.morph[MAPPING[v][1]] = parseInt($(v).value);
			_this.elem.morph.updateNode();
			_this.elem.morphGenerator.regenerate();
			update();
		};
	});
	this.update();
};

PropertyEditor.prototype.update = function(){
	var _this = this;
	if(!_this.elem) return;

	Object.keys(MAPPING).forEach(function(v){
		var value = MAPPING[v][0].split('.');

		if(_this.elem[value[0]][value[1]] !== undefined)
			$(v).value = _this.elem[value[0]][value[1]];
	});
	Materialize.updateTextFields();
};

module.exports = PropertyEditor;
