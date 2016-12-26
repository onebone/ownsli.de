include({
	morph: '/js/slide/editor-morph.js',
	workspace: '/js/slide/editor-workspace.js'
}, function(err){
	if(err) //TODO Error handle
	workspace.initWorkspace();
});
