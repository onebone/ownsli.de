window.socket = io();
window.documentId = location.href.match(/[^#?]+\/slide\/edit\/([a-zA-Z0-9]+)/)[1];

//FIXME Removal Required : test code
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
		//FIXME Removal Required : test code
		let myWorkspace = new workspace(null, $('#os-editor-workspace'));
		let mySlide = slide.createSlide({id: 0, pos: {x: 0, y: 0, z: 0}, rot: {x: 0, y: 0, z: 0}, size: {x: 300, y: 200}, order: 0, meta: {}}, [], myWorkspace);
		let mySlide2 = slide.createSlide({id: 1, pos: {x: 500, y: 0, z: 0}, rot: {x: 0, y: 0, z: 0}, size: {x: 200, y: 100}, order: 1, meta: {}}, [], myWorkspace);

		$('#os-editor-menu-layout').addEventListener('click', function(){
			$('#os-editor-layout-dialog').style.animationName = 'up';
		});

		$('#os-editor-layout-close').addEventListener('click', function(){
			$('#os-editor-layout-dialog').style.animationName = 'down';
		});
	});
//});
