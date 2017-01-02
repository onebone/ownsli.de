'use strict';

const {DocumentManager, Document, Slide, Shape} = require('./document');
const {SessionManager} = require('./session');
const {Vector3, Vector2} = require('./math');
const timers = require('timers');

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
									console.log('pos',data, typeof data.x);
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

									slide.setSize(new Vector2(data.x, data.y, data.z));
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

									shape.setSize(new Vector2(data.x, data.y));
									break;
								// type cannot be changed
								case 'meta':
									// TODO
									break;
							}
						}
					}
				});

				//socket.emit(data);
				group.broadcast('update shape', data, session);
			});
			// end update shape

			// create slide
			socket.on('create slide', (data) => {
				if(typeof data.document !== 'string' || typeof data.size  !== 'object' || typeof data.pos !== 'object' || typeof data.order !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;
				if(typeof data.pos.x !== 'number' || typeof data.pos.y !== 'number' || typeof data.pos.z !== 'number'
					|| typeof data.size.x !== 'number' || typeof data.size.y !== 'number') return;
				const slide = new Slide(
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

				/*socket.emit('create slide', {
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
				});*/
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

			// create shape
			socket.on('create shape', (data) => {
				if(typeof data.document !== 'string' || !data.size || !data.pos || typeof data.type !== 'number' || typeof data.slide !== 'number') return;
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

				/*socket.emit('create shape', {
					document: data.document,
					slide: data.slide,
					shape: shapeId
				});*/

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

			socket.on('save', (data) => {
				if(typeof data.document !== 'string') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				DocumentManager.saveDocument(group.getDocument());
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
