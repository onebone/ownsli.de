window.socket = io();
window.documentId = location.href.match(/[^#?]+\/slide\/edit\/([a-zA-Z0-9]+)/)[1];
window.documentName = undefined;
window.documentOwner = undefined;

socket.once('send data', function(event){
	include({
		utils: '/js/common/utils.js',
		interact: '/interactjs/dist/interact.min.js',
		morph: '/js/slide/editor-morph.js',
		propertyEditor: '/js/slide/editor-property-editor.js',
		workspace: '/js/slide/editor-workspace.js',
		slide: '/js/slide/editor-slide.js',
		shape: '/js/slide/editor-shape.js',
		clock: '/js/slide/editor-clock.js'
	}, function(err){
		if(err){
			console.error(err);
			return alert('Oops! An error occured while loading scripts...\nPlease press F5 to refresh!');
		}

		window.documentName = event.name;
		window.documentOwner = event.owner;

		clock($('#os-editor-menu-clock'));
		window.currentWorkspace = new workspace(null, $('#os-editor-workspace'));

		$('#os-editor-menu-layout').addEventListener('click', function(){
			$('#os-editor-layout-dialog').style.animationName = 'up';
		});

		$('#os-editor-layout-close').addEventListener('click', function(){
			$('#os-editor-layout-dialog').style.animationName = 'down';
		});

		$('#os-editor-menu-insert-slide').addEventListener('click', function(){
			slide.createSlide({
				pos: {x: 0, y: 0, z: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 300, y: 200},
				order: currentWorkspace.lastOrder(),
				meta: {}
			}, currentWorkspace);
		});

		$('#os-editor-menu-insert-image').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.ImageShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {}
			}, slide);
		});

		event.slides.forEach(function(v){
			var _slide = new slide(v, currentWorkspace);
			v.shapes.forEach(function(s){
				new shape(s, _slide);
			});
		});

		document.addEventListener('wheel', function(e){
			if(e.ctrlKey){
				e.stopPropagation();
				e.preventDefault();
				currentWorkspace.resize(e.deltaY);
			}
		});
	});
});

socket.emit('request data', {
	document: documentId
});
