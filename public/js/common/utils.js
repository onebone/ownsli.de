module.exports.bindPropertyToAttribute = function(original, target, propertyName, onUpdate){
	if(!onUpdate) onUpdate = function(){};

	Object.defineProperty(target, propertyName, {
		get: function(){
				return original.getAttribute('data-' + propertyName);
			},
		set: function(value){
				onUpdate(target[propertyName], value);
				original.setAttribute('data-' + propertyName, value);
			}
	});
};
