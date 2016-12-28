function ListPresentation(target){
	this.slideData = [];
	this.target = target;
}

ListPresentation.prototype.removeAll = function(){
	this.target.querySelectorAll('.slide-listing-content').forEach(function(v){
		v.remove();
	});
};

ListPresentation.prototype.listPresentation = function(){
	this.removeAll();

	var _this = this;

	var pad2 = function(s){
		s = '' + s;
		if(s.length === 1) return '0' + s;
		return s;
	};

	this.slideData.forEach(function(v){
		var slideContent = document.createElement('li');
		slideContent.classList.add('slide-listing-content', 'row');

		var name = document.createElement('a');
		name.classList.add('col', 's6');
		name.href = v.link;
		name.innerText = v.name;

		var dateString = '';
		dateString += v.date.getFullYear() + '-' + pad2(v.date.getMonth() + 1) + '-' + pad2(v.date.getDate()) + ' ';
		dateString += pad2(v.date.getHours()) + ':' + pad2(v.date.getMinutes());

		var date = document.createElement('span');
		date.classList.add('col', 's3');
		date.innerText = dateString;

		var author = document.createElement('span');
		author.classList.add('col', 's3');
		author.innerText = v.author;

		slideContent.append(name, date, author);
		_this.target.append(slideContent);
	});
};

module.exports = ListPresentation;
