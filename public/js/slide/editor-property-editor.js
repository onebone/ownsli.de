var MAPPING = {
	'#posx': 'pos.x',
	'#posy': 'pos.y',
	'#posz': 'pos.z',
	'#rotx': 'rot.x',
	'#roty': 'rot.y',
	'#rotz': 'rot.z',
	'#sizex': 'size.x',
	'#sizey': 'size.y'
};

function PropertyEditor(){
	this.node = $('#os-editor-property-editor');
}

PropertyEditor.prototype.bind = function(element, update){
	this.elem = element;
	this.updateCallback = update;

	if(element.type === 'slide'){
		this.node.querySelector('h3').innerText = "Slide #" + element.order;
	}else if(element.type === 'shape'){

	}else this.node.querySelector('h3').innerText = '';

	var _this = this;
	Object.keys(MAPPING).forEach(function(v){
		var value = MAPPING[v].split('.');

		$(v).onchange = function(){
			_this.elem[value[0]][value[1]] = parseInt($(v).value);
			update();
		};
	});
	this.update();
};

PropertyEditor.prototype.update = function(){
	var _this = this;
	Object.keys(MAPPING).forEach(function(v){
		var value = MAPPING[v].split('.');

		if(_this.elem[value[0]][value[1]] !== undefined)
			$(v).value = _this.elem[value[0]][value[1]];
	});
	Materialize.updateTextFields();
};

module.exports = PropertyEditor;
