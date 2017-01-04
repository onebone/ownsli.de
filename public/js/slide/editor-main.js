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
		currentWorkspace.document.meta = event.meta;

		window.htmleditor = ace.edit("htmleditor");
		htmleditor.setTheme('ace/theme/monokai');
		htmleditor.getSession().setMode('ace/mode/html');

		window.jseditor = ace.edit("jseditor");
		jseditor.setTheme('ace/theme/monokai');
		jseditor.getSession().setMode('ace/mode/javascript');

		window.csseditor = ace.edit('csseditor');
		csseditor.setTheme('ace/theme/monokai');
		csseditor.getSession().setMode('ace/mode/css');

		var exit = false;
		window.onbeforeunload = function(){
			if(!exit) return 'Are you sure you want to exit?';
		};

		$('#os-editor-menu-layout').addEventListener('click', function(){
			currentWorkspace.setLayoutEditing(true);
			$('#os-editor-layout-dialog').style.animationName = 'up';
		});

		$('#os-editor-layout-close').addEventListener('click', function(){
			currentWorkspace.setLayoutEditing(false);
			$('#os-editor-layout-dialog').style.animationName = 'down';
		});

		$('#os-editor-menu-insert-slide').addEventListener('click', function(){
			slide.createSlide({
				pos: {x: 0, y: 0, z: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 900, y: 700},
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

		$('#os-editor-menu-insert-richtext').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.TextShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {}
			}, slide);
		});

		$('#os-editor-menu-insert-video').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.VideoShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {}
			}, slide);
		});

		$('#os-editor-menu-insert-rectangle').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.RectangleShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {
					type: 'rectangle'
				}
			}, slide);
		});

		$('#os-editor-menu-insert-circle').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.RectangleShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {
					type: 'circle'
				}
			}, slide);
		});

		$('#os-editor-menu-insert-html').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId === undefined) return;
			var slide = currentWorkspace.document.slides[currentWorkspace.workingSlideId];

			if(!slide) return;

			shape.HTMLShape.createShape({
				pos: {x: 0, y: 0},
				rot: {x: 0, y: 0, z: 0},
				size: {x: 100, y: 100},
				meta: {}
			}, slide);
		});

		$('#os-editor-menu-insert-note').addEventListener('click', function(){
			var slide = currentWorkspace.getWorkingSlide();
			if(!slide) return;

			$('#os-editor-dialogs').style.display = 'flex';
		    $('#os-editor-slidenote-edit-dialog').style.display = 'block';

			$('#os-editor-slidenote-edit').value = slide.meta.note;
			$('#sndialog-ok').onclick = function(){
				slide.meta.note = $('#os-editor-slidenote-edit').value;
				slide.onUpdate(['meta']);
				$('#os-editor-dialogs').style.display = 'none';
				$('#os-editor-background-edit-dialog').style.display = 'none';
			};

			$('#sndialog-cancel').onclick = function(){
				$('#os-editor-dialogs').style.display = 'none';
				$('#os-editor-background-edit-dialog').style.display = 'none';
			};
		});

		socket.on('bower', function(data){
			if(typeof data === 'object'){
				var name = '';
				if(data.data.endpoint) {
					name = data.data.endpoint.name;
				}

				if(data.data.pkgMeta) {
					name = data.data.pkgMeta.name;
				}

			 	$('#bower-result').innerHTML +=
					'<div>' +
						'bower ' +
						'<span style="color: #c6ff00">' +
							data.data.pkgMeta.name +
							data.data.endpoint.target + ' ' +
						'</span>' +
						'<span style="color: #2196f3">' +
							data.id +
						'</span>' + ' ' +
						data.message +
					'</div>';
			}else $('#bower-result').innerHTML += (TRANSLATIONS[data] || data) + '<br>';
		});

		$('#bower-send').addEventListener('click', function(){
			socket.emit('bower', {
				document: documentId,
				bower: $('#os-bower-package').value
			});
		});

		$('#os-editor-menu-upload').addEventListener('click', function(){
			$('#os-editor-dialogs').style.display = 'flex';
			$('#os-editor-upload-resource-dialog').style.display = 'block';
		});

		$('#updialog-ok').addEventListener('click', function(){
			$('#os-editor-dialogs').style.display = 'none';
			$('#os-editor-upload-resource-dialog').style.display = 'none';
		});

		$('#os-editor-menu-file-save').addEventListener('click', function(){
			socket.emit('save', {
				document: documentId
			});
			Materialize.toast('<i class="mdi mdi-content-save"></i><i class="mdi mdi-check"></i>', 4000);
		});

		$('#os-editor-menu-finish').addEventListener('click', function(){
			socket.emit('save', {
				document: documentId
			});

			Materialize.toast('<i class="mdi mdi-content-save"></i><i class="mdi mdi-check"></i>', 4000);
			exit = true;
			setTimeout(function(){
				location.href = "/slide/view/" + documentId;
			}, 2000);
		});

		$('#os-editor-menu-present').addEventListener('click', function(){
			socket.emit('save', {
				document: documentId
			});

			Materialize.toast('<i class="mdi mdi-content-save"></i><i class="mdi mdi-check"></i>', 4000);
			exit = true;
			setTimeout(function(){
				var link = document.createElement('a');
				link.href = "/slide/present/" + documentId + '/';
				link.target = "_blank";
				link.click();
			}, 2000);
		});

		$('#os-editor-menu-undo').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId){
				socket.emit('undo', {
					document: documentId,
					slide: currentWorkspace.workingSlideId
				});
			}
		});
		$('#os-editor-menu-redo').addEventListener('click', function(){
			if(currentWorkspace.workingSlideId){
				socket.emit('redo', {
					document: documentId,
					slide: currentWorkspace.workingSlideId
				});
			}
		});

		var URL_REGEX = /^url\("(.+)"\)$/;
		var bgHandler = function(docMode){
			return function(){
				var slide = currentWorkspace.getWorkingSlide();
				if(!docMode && !slide) return;

				$('#os-editor-dialogs').style.display = 'flex';
				$('#os-editor-background-edit-dialog').style.display = 'block';

				var meta = docMode ? currentWorkspace.document.meta : slide.meta
				var match = meta.background.match(URL_REGEX);
				if(match){
					$('#os-editor-background-src').value = match[1];
					$('#os-editor-background-color').value = '';
				}else{
					$('#os-editor-background-color').value = meta.background;
					$('#os-editor-background-src').value = ''
				}

				$('#bgdialog-ok').onclick = function(){
					if($('#os-editor-background-src').value) meta.background = 'url("' + $('#os-editor-background-src').value + '")';
					else meta.background = $('#os-editor-background-color').value;

					if(!docMode) slide.onUpdate(['meta']);
					else socket.emit('document meta', {
						document: documentId,
						name: 'background',
						value: meta.background
					});

					$('#os-editor-dialogs').style.display = 'none';
					$('#os-editor-background-edit-dialog').style.display = 'none';
				};

				$('#bgdialog-cancel').onclick = function(){
					$('#os-editor-dialogs').style.display = 'none';
					$('#os-editor-background-edit-dialog').style.display = 'none';
				};
			};
		};

		$('#os-editor-menu-background').addEventListener('click', bgHandler(false));
		$('#os-editor-menu-background-doc').addEventListener('click', bgHandler(true));

		socket.on('document meta', function(ev){
			currentWorkspace.document.meta[ev.name] = ev.value;
		});

		Object.keys(event.slides).sort(function(a, b){
			return event.slides[a].order > event.slides[b].order ? 1 : -1;
		}).forEach(function(index){
			var v = event.slides[index];

			var _slide = new slide(v, currentWorkspace);
			v.shapes.forEach(function(s){
				s.slide = _slide.id;
				shape.fromType(s, _slide);
			});
		});

		document.addEventListener('wheel', function(e){
			if(e.ctrlKey){
				e.stopPropagation();
				e.preventDefault();
				if(currentWorkspace.isLayoutEditing()) currentWorkspace.resizeLayout(e.deltaY);
				currentWorkspace.resize(e.deltaY);
			}
		});

		tinymce.init({
			selector: '#os-editor-tinymce-attachment',
			height: 500,
			theme: 'modern',
			plugins: [
				'advlist autolink lists link image charmap print preview hr anchor pagebreak',
				'searchreplace wordcount visualblocks visualchars code fullscreen',
				'insertdatetime media nonbreaking save table contextmenu directionality',
				'emoticons template paste textcolor colorpicker textpattern imagetools codesample toc'
			],
			toolbar1: 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
			toolbar2: 'print preview media | forecolor backcolor emoticons | codesample | fontsizeselect fontselect customfont',
			setup: function(editor){
				editor.addButton('customfont', {
					text: 'New Font',
					icon: false,
					onclick: function() {
						editor.windowManager.open({
							title: 'New Font',
							body: [
								{type: 'Label', text: 'Enter your fontname.\n(warning: unless you upload your stylesheet, font may not be shown from other computers)'},
								{type: 'textbox', name: 'fontname', label: 'FontName'}
							],
							onsubmit: function(e) {
								// Insert content when the window form is submitted
								editor.execCommand('FontName', false, e.data.fontname);
							}
						});
					}
				});
			},
			image_advtab: true
		});
	});

	var colors = jsColorPicker('input.color', {
		customBG: '#222',
		readOnly: true,
		// patch: false,
		init: function(elm, colors){
			elm.style.backgroundColor = elm.value;
			elm.style.color = colors.rgbaMixCustom.luminance > 0.22 ? '#222' : '#ddd';
		}
	});
});

socket.emit('request data', {
	document: documentId
});
