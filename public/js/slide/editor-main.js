window.socket = io();
window.documentId = location.href.match(/[^#?]+\/slide\/edit\/([a-zA-Z0-9]+)/)[1];

window.socket.once('send data', function(event){
	include({
		utils: '/js/common/utils.js',
		interact: '/interactjs/dist/interact.min.js',
		morph: '/js/slide/editor-morph.js',
		workspace: '/js/slide/editor-workspace.js',
		clock: '/js/slide/editor-clock.js'
	}, function(err){
		if(err) return alert('Oops! An error occured while loading scripts...\n Please press F5 to refresh!');

		clock($('#os-editor-menu-clock'));
	});
});
