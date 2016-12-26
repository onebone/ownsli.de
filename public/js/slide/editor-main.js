include({
	morph: '/js/slide/editor-morph.js',
	workspace: '/js/slide/editor-workspace.js',
	interact: '/interactjs/dist/interact.min.js'
}, function(err){
	if(err) //TODO Error handle
	workspace.initWorkspace(null, document.body);
});
