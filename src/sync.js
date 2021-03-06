'use strict';

const Action = require('./action');
const {DocumentManager, Document, Slide, Shape} = require('./document');
const {SessionManager} = require('./session');
const {Vector3, Vector2} = require('./math');
const timers = require('timers');
const bower = require('bower');
const path = require('path');

const MAX_REDO = 20;
const MAX_UNDO = 20;

const BOWER_REGEX = /^([a-zA-Z0-9](?:-?[a-zA-Z0-9]){0,38}\/[a-zA-Z0-9-_.]{1,100})|([a-zA-Z0-9-_.]{1,100})$/;
let io = null;
let groups = {};

class Sync{
	/**
	 * This function not for general use
	 * This should be called once when starting http
	 */
	static setServer(server, session){
		io = require('socket.io')(server);

		io.use((socket, next) => {
			session(socket.request, socket.request.res, next);
		});

		io.on('connection', (socket) => {
			const session = SessionManager.getSession(socket.request.session.token);

			if(session === null){
				return;
			}

			socket.on('request data', (data) => {
				if(typeof data !== 'object') return;
				const group = Sync.getGroup(data.document);
				if(!group){
					socket.emit('send data', null); // there is no group found matching the document
				}else{
					group.addSession(session);
					group.setSocket(session, socket);

					socket.emit('send data', group.getDocument().toArray());
				}
			});

			// update slide
			socket.on('update slide', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || !Array.isArray(data.packets)) return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				data.packets.forEach((pk, index) => {
					if(!pk || typeof pk.slide !== 'number'){
						delete data.packets[index];
						return;
					}
					const slide = group.getDocument().getSlide(pk.slide);
					if(!slide){
						delete data.packets[index];
						return;
					}

					for(const property in pk){ // validation and data update
						if(pk.hasOwnProperty(property)){
							const data = pk[property];
							switch(property.toLowerCase()){
								case 'pos':
									if(typeof data.x !== 'number' || typeof data.y !== 'number' || typeof data.z !== 'number'){
										delete pk['pos'];
										break;
									}

									slide.setPosition(new Vector3(data.x, data.y, data.z));
									break;
								case 'rot':
									if(typeof data.x !== 'number' || typeof data.y !== 'number' || typeof data.z !== 'number'){
										delete pk['rot'];
										break;
									}

									slide.setRotation(new Vector3(data.x, data.y, data.z));
									break;
								case 'size':
									if(typeof data.x !== 'number' || typeof data.y !== 'number'){
										delete pk['size'];
										break;
									}

									slide.setSize(new Vector2(data.x, data.y));
									break;
								case 'order':
									if(typeof data !== 'number'){
										delete pk['order'];
										break;
									}

									slide.setOrder(data);
									break;
								// shapes will be updated in 'update shape' packet
								case 'meta':
									// TODO: Validate meta
									slide.setMetadata(data);
							}
						}
					}
				});

				//socket.emit('update slide', data);
				group.broadcast('update slide', data, session);
			});
			// end update slide

			// update shape
			socket.on('update shape', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || !Array.isArray(data.packets)) return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				data.packets.forEach((pk, index) =>{
					if(!pk || typeof pk.slide !== 'number' || typeof pk.shape !== 'number'){
						delete data.packets[index];
						return;
					}
					const slide = group.getDocument().getSlide(pk.slide);
					if(!slide){
						delete data.packets[index];
						return;
					}
					const shape = slide.getShape(pk.shape);
					if(!shape){
						delete data.packets[index];
						return;
					}

					for(const property in pk){ // validation and data update
						if(pk.hasOwnProperty(property)){
							const data = pk[property];
							switch(property.toLowerCase()){
								case 'pos':
									if(typeof data.x !== 'number' || typeof data.y !== 'number'){
										delete pk['pos'];
										break;
									}

									if(typeof data.start === 'object'){
										if(typeof data.start.x === 'number' && typeof data.start.y === 'number'){
											group.addUndo(slide.getId(), 'update shape', {
												shape: shape.getId(),
												pos: [data.start.x, data.start.y]
											});
										}
										delete pk['start'];
									}

									shape.setPosition(new Vector2(data.x, data.y));
									break;
								case 'rot':
									if(typeof data.x !== 'number' || typeof data.y !== 'number' || typeof data.z !== 'number'){
										delete pk['rot'];
										break;
									}

									shape.setRotation(new Vector3(data.x, data.y, data.z));
									break;
								case 'size':
									if(typeof data.x !== 'number' || typeof data.y !== 'number'){
										delete pk['size'];
										break;
									}

									if(typeof data.start === 'object'){
										if(typeof data.start.x === 'number' && typeof data.start.y === 'number'){
											group.addUndo(slide.getId(), 'update shape', {
												shape: shape.getId(),
												size: [data.start.x, data.start.y]
											});
										}
										delete pk['start'];
									}

									shape.setSize(new Vector2(data.x, data.y));
									break;
								// type cannot be changed
								case 'meta':
									// TODO validate
									shape.setMetadata(data);
									break;
							}
						}
					}
				});

				//socket.emit(data);
				group.broadcast('update shape', data, session);
			});
			// end update shape

			socket.on('document meta', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string'|| typeof data.name !== 'string' || typeof data.value !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				group.getDocument().setMetadata(data.name, data.value);
				group.broadcast('document meta', data, session);
			});

			// create slide
			socket.on('create slide', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || typeof data.size  !== 'object' || typeof data.pos !== 'object' || typeof data.order !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;
				if(typeof data.pos.x !== 'number' || typeof data.pos.y !== 'number' || typeof data.pos.z !== 'number'
					|| typeof data.size.x !== 'number' || typeof data.size.y !== 'number') return;

				const slide = new Slide(
					group.getDocument(),
					-1,
					new Vector3(data.pos.x, data.pos.y, data.pos.z),
					new Vector2(data.size.x, data.size.y),
					new Vector3(0, 0, 0), // default rotation is 0, 0, 0
					data.order,
					data.meta || {}, // empty meta
					{} // empty shapes
				);
				const slideId = group.getDocument().addSlide(slide);

				const pos = slide.getPosition();
				const rot = slide.getRotation();
				const size = slide.getSize();

				group.broadcast('create slide', {
					document: data.document,
					slide: slideId,
					pos: {
						x: pos.x, y: pos.y, z: pos.z
					},
					rot: {
						x: rot.x, y: rot.y, z: rot.z
					},
					size: {
						x: size.x, y: size.y
					},
					order: slide.getOrder(),
					meta: slide.getMetadata()
				});
			});
			// end create slide

			socket.on('copy slide', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || typeof data.slide !== 'number' || typeof data.order !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				const slide = group.getDocument().getSlide(data.slide);
				if(!slide) return;
				const clone = slide.clone();
				clone._id = -1;
				clone._order = data.order;
				const slideId = group.getDocument().addSlide(clone);

				const pos = slide.getPosition();
				const rot = slide.getRotation();
				const size = slide.getSize();

				let shapesArr = [];

				const shapes = slide.getShapes();
				Object.keys(shapes).forEach((index) => {
					const shape = shapes[index];
					shapesArr.push(shape.toArray());
				});

				group.broadcast('create slide', {
					document: data.document,
					slide: slideId,
					pos: {
						x: pos.x, y: pos.y, z: pos.z
					},
					rot: {
						x: rot.x, y: rot.y, z: rot.z
					},
					size: {
						x: size.x, y: size.y
					},
					order: slide.getOrder(),
					meta: slide.getMetadata(),
					shapes: shapesArr
				});
			});

			// create shape
			socket.on('create shape', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || typeof data.size !== 'object' || typeof data.pos !== 'object' || typeof data.type !== 'number' || typeof data.slide !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				if(typeof data.pos.x !== 'number' || typeof data.pos.y !== 'number'
					|| typeof data.size.x !== 'number' || typeof data.size.y !== 'number') return;
				const slide = group.getDocument().getSlide(data.slide);
				if(!slide){
					//FIXME no packets in data. delete data.packets[index];
					return;
				}
				const shape = new Shape(
					-1,
					new Vector2(data.pos.x, data.pos.y),
					new Vector3(0, 0, 0), // default rotation is 0,0,0
					new Vector2(data.size.x, data.size.y),
					data.type,
					data.meta || {}
				);
				const shapeId = slide.addShape(shape);

				group.addUndo(data.slide, 'create shape', shapeId);
				group.broadcast('create shape', {
					document: data.document,
					slide: data.slide,
					shape: shapeId,
					pos: shape.getPosition(),
					rot: shape.getRotation(),
					size: shape.getSize(),
					meta: shape.getMetadata(),
					type: shape.getType()
				});
			});
			// end create shape

			// delete slide
			socket.on('delete slide', (data) => {
				if(typeof data !== 'object') return;

				if(typeof data.document !== 'string') return; // document validation
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				const slide = group.getDocument().getSlide(data.slide);
				if(slide && group.getDocument().removeSlide(data.slide)){
					group.broadcast('delete slide', {
						document: data.document,
						slide: data.slide
					});
				}
			});
			// end delete slide

			// delete shape
			socket.on('delete shape', (data) => {
				if(typeof data !== 'object') return;

				if(typeof data.document !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				const slide = group.getDocument().getSlide(data.slide);
				if(!slide) return;

				const shape = slide.getShape(data.shape);
				if(shape && slide.removeShape(data.shape)){
					group.addUndo(data.slide, 'delete shape', shape);
					group.broadcast('delete shape', {
						document: data.document,
						slide: data.slide,
						shape: data.shape
					});
				}
			});
			// end delete shape

			socket.on('update order', (data) => {
				if(typeof data !== 'object') return;

				if(typeof data.document !== 'string' || typeof data.orders !== 'object') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				Object.keys(data.orders).forEach(id => {
					if(typeof data.orders[id] !== 'number') return;

					const slide = group.getDocument().getSlide(id);
					if(!slide) return;

					slide.setOrder(data.orders[id]);
				});
				group.getDocument().reorderSlides();

				const newOrders = {};
				const slides = group.getDocument().getSlides();
				Object.keys(slides).forEach(id => {
					const slide = slides[id];
					newOrders[slide.getId()] = slide.getOrder();
				});

				group.broadcast('update order', {
					document: data.document,
					orders: newOrders
				});
			});
			// end update order

			socket.on('save', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				DocumentManager.saveDocument(group.getDocument());
			});

			socket.on('undo', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;
				if(typeof data.slide !== 'number' && typeof data.slide !== 'string') return;

				const action = group.popUndo(data.slide);
				const slide = group.getDocument().getSlide(data.slide);
				if(!action || !slide) return;
				const d = action.getData();
				switch(action.getType()){
					case 'delete shape':{
						const shape = slide.getShape(d);
						if(!shape) return;
						group.broadcast('delete shape', {
							document: group.getDocument().getId(),
							slide: data.slide,
							shape: d
						});

						group.addRedo(data.slide, 'delete shape', shape);
						}
						break;
					case 'create shape':{
						const shape = new Shape(
							-1,
							d.getPosition(),
							d.getRotation(),
							d.getSize(),
							d.getType(),
							d.getMetadata()
						);

						const shapeId = slide.addShape(shape);
						group.addRedo(data.slide, 'create shape', shapeId);
						group.broadcast('create shape', {
							document: group.getDocument().getId(),
							slide: slide.getId(),
							shape: shapeId,
							pos: shape.getPosition(),
							rot: shape.getRotation(),
							size: shape.getSize(),
							meta: shape.getMetadata(),
							type: shape.getType()
						});
						}
						break;
					case 'update shape': {
						if(d.size){
							const shape = slide.getShape(d.shape);
							if(shape){
								const size = shape.getSize();
								group.addRedo(slide.getId(), 'update shape', {
									shape: d.shape,
									size: [size.x, size.y]
								});
								group.broadcast('update shape', {
									document: group.getDocument().getId(),
									packets: [{
										slide: slide.getId(),
										shape: d.shape,
										size: {x: d.size[0], y: d.size[1]}
									}]
								});

								shape.setSize(new Vector2(d.size[0], d.size[1]));
							}
						}

						if(d.pos){
							const shape = slide.getShape(d.shape);
							if(shape){
								const pos = shape.getPosition();
								group.addRedo(slide.getId(), 'update shape', {
									shape: d.shape,
									pos: [pos.x, pos.y]
								});

								shape.setPosition(new Vector2(d.pos[0], d.pos[1]));
								group.broadcast('update shape', {
									document: group.getDocument().getId(),
									packets: [{
										slide: slide.getId(),
										shape: d.shape,
										pos: {x: d.pos[0], y: d.pos[1]}
									}]
								});
							}
						}

						if(d.meta){
							group.broadcast('update shape', {
								document: group.getDocument().getId(),
								slide: slide.getId(),
								packets: [{
									shape: d.shape,
									meta: d.meta
								}]
							});
						}
						break;
					}
				}
			});

			socket.on('redo', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;
				if(typeof data.slide !== 'number' && typeof data.slide !== 'string') return;

				const action = group.popRedo(data.slide);
				const slide = group.getDocument().getSlide(data.slide);
				if(!action || !slide) return;
				const d = action.getData();
				switch(action.getType()){
					case 'delete shape':{
						const shape = slide.getShape(d);
						if(!shape) return;
						group.broadcast('delete shape', {
							document: group.getDocument().getId(),
							slide: data.slide,
							shape: d
						});

						group.addUndo(data.slide, 'delete shape', shape);
					}
						break;
					case 'create shape':{
						const shape = new Shape(
							-1,
							d.getPosition(),
							d.getRotation(),
							d.getSize(),
							d.getType(),
							d.getMetadata()
						);

						const shapeId = slide.addShape(shape);
						group.addUndo(data.slide, 'create shape', shapeId);
						group.broadcast('create shape', {
							document: group.getDocument().getId(),
							slide: slide.getId(),
							shape: shapeId,
							pos: shape.getPosition(),
							rot: shape.getRotation(),
							size: shape.getSize(),
							meta: shape.getMetadata(),
							type: shape.getType()
						});
					}
						break;
					case 'update shape':{
						if(d.size){
							const shape = slide.getShape(d.shape);
							if(shape){
								const size = shape.getSize();
								group.addUndo(slide.getId(), 'update shape', {
									shape: d.shape,
									size: [size.x, size.y]
								});
								group.broadcast('update shape', {
									document: group.getDocument().getId(),
									packets: [{
										slide: slide.getId(),
										shape: d.shape,
										size: {x: d.size[0], y: d.size[1]}
									}]
								});

								shape.setSize(new Vector2(d.size[0], d.size[1]));
							}
						}

						if(d.pos){
							const shape = slide.getShape(d.shape);
							if(shape){
								const pos = shape.getPosition();
								group.addUndo(slide.getId(), 'update shape', {
									shape: d.shape,
									pos: [pos.x, pos.y]
								});

								shape.setPosition(new Vector2(d.pos[0], d.pos[1]));
								group.broadcast('update shape', {
									document: group.getDocument().getId(),
									packets: [{
										slide: slide.getId(),
										shape: d.shape,
										pos: {x: d.pos[0], y: d.pos[1]}
									}]
								});
							}
						}

						if(d.meta){
							group.broadcast('update shape', {
								document: group.getDocument().getId(),
								slide: slide.getId(),
								packets: [{
									shape: d.shape,
									meta: d.meta
								}]
							});
						}
						}
						break;
				}
			});

			socket.on('bower', (data) => {
				if(typeof data !== 'object') return;
				if(typeof data.document !== 'string' || typeof data.bower !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				if(!BOWER_REGEX.test(data.bower)) return;
				bower.commands.install([data.bower], {}, {
					cwd: path.join(__dirname, '..', 'contents', data.document),
					directory: 'bower_components'
				}).on('log', (result) => {
					socket.emit('bower', result);
				}).on('end', () => {
					socket.emit('bower', 'slide.editor.bower.complete');
				}).on('error', (err) => {
					socket.emit('bower', 'ERROR: ' + err.code);
				});
			});
		});
	}

	/**
	 * Create group which document will be synchronized
	 * @param document Document  | Document which will be synced
	 * @param sessions optional Session  | Sessions which will be initialized
	 * @return boolean
	 */
	static createGroup(document, ...sessions){
		if(!document instanceof Document){
			return false;
		}

		if(!groups[document.getId()]) groups[document.getId()] = new Group(document, ...sessions);
		return true; // return true even if group already exists
	}

	/**
	 * Add session to a group
	 * @param document Document|string
	 * @param session Session
	 */
	static joinSession(document, ...session){
		if(document instanceof Document){
			document = document.getId();
		}

		if(typeof document !== 'string'){
			return false;
		}

		if(groups[document]){
			groups[document].addSession(...session);
			return true;
		}
		return false;
	}

	/**
	 * Removes session from a group
	 * @param sessions Session
	 * @return boolean
	 */
	static leaveSession(...sessions){
		sessions.forEach((session) => {
			const document = session.getGroup();

			if(document && groups[document]){
				groups[document].removeSession(session);
			}
		});
	}

	/**
	 * Removes group
	 * @param document
	 */
	static removeGroup(document){
		if(document instanceof Document){
			document = document.getId();
		}

		if(typeof document !== 'string'){
			return false;
		}

		if(groups[document]){
			groups[document].removeAll();

			delete groups[document];
			return true;
		}
		return false;
	}

	/**
	 * @param {string|Document} document
	 * @return {Group|null}
	 */
	static getGroup(document){
		if(document instanceof Document){
			document = document.getId();
		}

		if(typeof document !== 'string'){
			return null;
		}

		return groups[document] || null;
	}

	static getGroups(){
		let ret = {};
		for(const document in groups){
			if(groups.hasOwnProperty(document)){
				const group = groups[document];
				ret[document] = group.getSessions();
			}
		}
		return ret;
	}

	static resetGroups(){
		for(const document in groups){
			if(groups.hasOwnProperty(document)){
				const group = groups[document];
				group.removeAll();
			}
		}
		groups = {};
	}
}

class Group{
	/**
	 * @param document Document
	 * @param sessions Session
	 */
	constructor(document, ...sessions){
		this._document = document;
		this._sessions = sessions;
		this._sockets = {};
		this._creationTime = Date.now();
		this._undo = {};
		this._redo = {};

		this._sessions.forEach((session) => {
			if(session.getGroup() !== null){
				Sync.getGroup(session.getGroup()).removeSession(session);
			}

			session.__setGroup(document.getId());
		});

		timers.setTimeout(this.save.bind(this), 10000); // save every 10 seconds
	}

	save(){
		DocumentManager.saveDocument(this._document);

		timers.setTimeout(this.save.bind(this), 10000); // save every 10 seconds
	}

	addUndo(slide, type, data){
		if(this._undo.length >= MAX_UNDO){
			this._undo.shift();
		}

		this._undo[slide] = this._undo[slide] || [];
		this._undo[slide].push(new Action(slide, type, data));
	}

	popUndo(slide){
		if(!this._undo[slide]) return null;
		const action = this._undo[slide].pop();
		if(action){
			return action;
		}
		return null;
	}

	addRedo(slide, type, data){
		if(this._redo.length >= MAX_REDO){
			this._redo.shift();
		}

		this._redo[slide] = this._redo[slide] || [];
		this._redo[slide].push(new Action(slide, type, data));
	}

	popRedo(slide){
		if(!this._redo[slide]) return null;
		const action = this._redo[slide].pop();
		if(action){
			return action;
		}
		return null;
	}

	/**
	 * @param {Session} session
	 * @param socket
	 */
	setSocket(session, socket){
		this._sockets[session.getToken()] = socket;
	}

	/**
	 * @param {Session} session
	 */
	getSocket(session){
		return this._sockets[session.getToken()] || null;
	}

	getSockets(){
		return this._sockets;
	}

	/**
	 * @param {string} type
	 * @param {Object} data
	 * @param {Session} except
	 */
	broadcast(type, data, except = null){
		Object.keys(this._sockets).forEach(token => {
			if(except && except.getToken() === token) return;
			const socket = this._sockets[token];
			socket.emit(type, data);
		});
	}

	/**
	 * @return {number}
	 */
	getCreationTime(){
		return this._creationTime;
	}

	/**
	 * @return {Document}
	 */
	getDocument(){
		return this._document;
	}

	/**
	 * @param {Session} session
	 * @return boolean
	 */
	hasSession(session){
		for(const index in this._sessions){
			if(this._sessions.hasOwnProperty(index)){
				if(this._sessions[index] === session) return true;
			}
		}
		return false;
	}

	getSessions(){
		return this._sessions;
	}

	/**
	 * @param {Session} sessions
	 */
	addSession(...sessions){
		const _this = this;
		sessions.forEach((session) => {
			_this._sessions.push(session);
			session.__setGroup(_this._document.getId());
		});
	}

	/**
	 * @param {Session} sessions
	 */
	removeSession(...sessions){
		sessions.forEach((session) => {
			this._sessions.forEach((sess, index) =>{
				if(!sess) return;

				if(sess.getUserId() === session.getUserId()){
					this._sessions.splice(index, 1);
					delete this._sockets[session.getToken()];
				}
			});
		});
	}

	removeAll(){
		this.removeSession(...this._sessions);
	}
}

module.exports = Sync;
