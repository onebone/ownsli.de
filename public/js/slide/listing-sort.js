var SORT_MODES = {
	name: 1,
	date: 2,
	author: 4
};

var SORT_MODES_BY_VALUE = {};

Object.keys(SORT_MODES).forEach(function(v){
	SORT_MODES_BY_VALUE[SORT_MODES[v]] = v;
});

var SORT_FUNCTION = {
	1: function(v1, v2){
		return v1.name.localeCompare(v2.name);
	},
	2: function(v1, v2){
		return v2.date.getTime() - v1.date.getTime();
	},
	4: function(v1, v2){
		return v1.author.localeCompare(v2.author);
	}
};

var SORT_MODE_REVERSED = 8;

var removeReverse = function(sortCode){
	if(sortCode >= 8) return sortCode - 8;
	return sortCode;
};

var listDocuments = function(view, mode){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/document/get?mode=' + mode, true);

	xhr.onreadystatechange = function(){
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200){
			var data = JSON.parse(xhr.responseText);
			if(!data) return; // TODO Show error
			view.slideData = [];
			data.forEach((document) => {
				view.slideData.push({
					name: document.name,
					date: new Date(document.lastSave),
					author: document.owner,
					link: '/slide/edit/' + document.id
				});
			});

			view.listPresentation();
		}
	};

	view.removeAll();
	xhr.send(null);
};

module.exports = function(view){
	var SORT_MODE = 1;
	var header = view.target.querySelector('.slide-listing-header');

	['name', 'date', 'author'].forEach(function(v){
		var button = header.querySelector('[data-sort="' + v + '"]');
		button.addEventListener('click', function(){
			var prev = header.querySelector('[data-sort="' + SORT_MODES_BY_VALUE[removeReverse(SORT_MODE)] + '"] i').classList;
			prev.remove('mdi-chevron-down');
			prev.remove('mdi-chevron-up');

			if(SORT_MODE & SORT_MODES[v]){
				SORT_MODE = (SORT_MODE & SORT_MODE_REVERSED) ? SORT_MODES[v] : SORT_MODES[v] | SORT_MODE_REVERSED;
			}else SORT_MODE = SORT_MODES[v];

			if(SORT_MODE >= 8){
				button.querySelector('i').classList.add('mdi-chevron-up');
			}else button.querySelector('i').classList.add('mdi-chevron-down');

			listDocuments(view, SORT_MODE);
			return false;
		});
	});

	listDocuments(view, 1);
};
