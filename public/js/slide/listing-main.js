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
});
