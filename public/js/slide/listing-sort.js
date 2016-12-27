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
}

var SORT_MODE_REVERSED = 8;

var removeReverse = function(sortCode){
	if(sortCode >= 8) return sortCode - 8;
	return sortCode;
}
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

			var _sort = removeReverse(SORT_MODE);
			view.slideData = view.slideData.sort(SORT_FUNCTION[_sort]);

			if(SORT_MODE >= 8){
				view.slideData = view.slideData.reverse();
				button.querySelector('i').classList.add('mdi-chevron-up');
			}else button.querySelector('i').classList.add('mdi-chevron-down');

			view.listPresentation();

			return false;
		});
	});

	view.listPresentation();
};
