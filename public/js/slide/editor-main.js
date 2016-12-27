include({
	morph: '/js/slide/editor-morph.js',
	workspace: '/js/slide/editor-workspace.js',
	interact: '/interactjs/dist/interact.min.js'
}, function(err){
	if(err) return alert('Oops! An error occured while loading scripts...\n Please press F5 to refresh!');
	workspace.initWorkspace(null, document.body);
});
