window.socket = io();
window.documentId = location.href.match(/[^#?]+\/slide\/edit\/([a-zA-Z0-9]+)/)[1];

//socket.once('send data', function(event){
	include({
		utils: '/js/common/utils.js',
		interact: '/interactjs/dist/interact.min.js',
		morph: '/js/slide/editor-morph.js',
		workspace: '/js/slide/editor-workspace.js',
		slide: '/js/slide/editor-slide.js',
		clock: '/js/slide/editor-clock.js'
	}, function(err){
		if(err){
			console.error(err);
			return alert('Oops! An error occured while loading scripts...\nPlease press F5 to refresh!');
		}

		clock($('#os-editor-menu-clock'));
	});
//});
