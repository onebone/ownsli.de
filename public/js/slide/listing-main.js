include({
	utils: '/js/common/utils.js',
	view: '/js/slide/listing-view.js',
	sort: '/js/slide/listing-sort.js'
}, function(err){
	if(err){
		console.error(err);
		return alert('Oops! An error occured while loading scripts...\nPlease press F5 to refresh!');
	}

	sort(new view($('.slide-listing')));

	var MODE_INPUT = 0;
	var MODE_CREATE = 1;

	var currentMode = MODE_INPUT;

	var submitHandler = function(){
		if(currentMode === MODE_INPUT){
			$('#title-input-wrapper').style.animationName = 'inflate';
			$('.create-row button').setAttribute('type', 'submit');
			currentMode = MODE_CREATE;
			return false;
		}
		console.log(currentMode);
		return true;
	};

	$('.create-row button').onclick = submitHandler;
	$('form').onsubmit = submitHandler;
});
