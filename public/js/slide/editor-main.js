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
		clock: '/js/slide/editor-clock.js'
	}, function(err){
		if(err){
			console.error(err);
			return alert('Oops! An error occured while loading scripts...\nPlease press F5 to refresh!');
		}

		window.documentName = event.name;
		window.documentOwner = event.owner;

		clock($('#os-editor-menu-clock'));
		var currentWorkspace = new workspace(null, $('#os-editor-workspace'));

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
				size: {x: 200, y: 300},
				order: currentWorkspace.lastOrder(),
				meta: {}
			}, currentWorkspace);
		});

		event.slides.forEach(function(v){
			var slide = new slide(v, currentWorkspace);
			v.shapes.forEach(function(s){
				new shape(s, v);
			});
		});

		/*var isCtrlPressing = false;

		document.addEventListener('keydown', function(e){
			if(e.which === 17) isCtrlPressing = true;
		});

		document.addEventListener('keyup', function(e){
			if(e.which === 17) isCtrlPressing = false;
		});*/

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
