'use strict';

const {DocumentManager, Document, Slide, Shape} = require('./document');
const {SessionManager} = require('./session');
const {Vector3, Vector2} = require('./math');

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
					const document = group.getDocument();

					const slides = document.getSlides();
					let slideArr = [];
					Object.keys(slides).forEach(index => {
						const slide = slides[index];

						let shapesArr = [];

						const shapes = slide.getShapes();
						Object.keys(shapes).forEach(index => {
							const shape = shapes[index];
							shapesArr.push(shape.toArray());
						});

						const pos = slide.getPosition();
						const rot = slide.getRotation();
						slideArr.push({ // slide info
							vec: [pos.getX(), pos.getY(), pos.getZ()],
							rotation: [rot.getX(), rot.getY(), rot.getZ()],
							order: slide.getOrder(),
							meta: slide.getMetadata(),
							shapes: shapesArr
						});
					});
					socket.emit('send data', {
						id: document.getId(),
						name: document.getName(),
						owner: document.getOwner(),
						slides: slideArr,
						invitation: document.getInvitations(),
						lastSave: document.getLastSave()
					});
				}
			});

			// update slide
			socket.on('update slide', (data) => {
				if(typeof data.document !== 'string' || !Array.isArray(data.packets)) return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				data.packets.forEach((pk, index) => {
					if(typeof pk.slide !== 'number'){
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

				socket.emit('update slide', data);
				// TODO: Broadcast to group clients
			});
			// end update slide

			// update shape
			socket.on('update shape', (data) => {
				if(typeof data.document !== 'string' || !Array.isArray(data.packets)) return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				data.packets.forEach((pk, index) =>{
					if(typeof pk.slide !== 'number' || typeof pk.shape !== 'number'){
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

				// TODO: broadcast update shape packet to group clients
				socket.emit(data);
			});
			// end update shape

			// create slide
			socket.on('create slide', (data) => {
				if(typeof data.document !== 'string' || !data.size || !data.pos || typeof data.order !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				if(typeof data.pos.x !== 'number' || typeof data.pos.y !== 'number' || typeof data.pos.z !== 'number'
					|| typeof data.size.x !== 'number' || typeof data.size.y !== 'number') return;
				const slideId = group.getDocument().addSlide(new Slide(
					new Vector3(data.pos.x, data.pos.y, data.pos.z),
					new Vector2(data.size.x, data.size.y),
					new Vector3(0, 0, 0), // default rotation is 0, 0, 0
					data.order,
					{}, // empty meta
					{} // empty shapes
				));

				socket.emit('create slide', {
					document: data.document,
					slide: slideId
				}); // TODO Broadcast to group clients
			});
			// end create slide

			// create shape
			socket.on('create shape', (data) => {
				if(typeof data.document !== 'string' || !data.size || !data.pos || typeof data.type !== 'number') return;
				const group = Sync.getGroup(data.document);
				if(!group || !group.hasSession(session)) return;

				if(typeof data.pos.x !== 'number' || typeof data.pos.y !== 'number' || typeof data.pos.z !== 'number'
					|| typeof data.size.x !== 'number' || typeof data.size.y !== 'number') return;
				const slide = group.getDocument().getSlide(data.slide);
				if(!slide){
					delete data.packets[index];
					return;
				}

				const shapeId = slide.addShape(new Shape(
					new Vector2(data.pos.x, data.pos.y),
					new Vector3(0, 0, 0), // default rotation is 0,0,0
					new Vector2(data.size.x, data.size.y),
					data.type,
					[]
				));

				socket.emit('create shape', {
					document: data.document,
					slide: data.slide,
					shape: shapeId
				}); // TODO Broadcast to all group clients
			});
			// end create shape
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

			groups[document].removeSession(session);
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
		this._creationTime = Date.now();

		this._sessions.forEach((session) => {
			if(session.getGroup() !== null){
				Sync.getGroup(session.getGroup()).removeSession(session);
			}

			session.__setGroup(document.getId());
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
		const _this = this;
		sessions.forEach((session) => {
			_this._sessions.forEach((sess, index) =>{
				if(!sess) return;

				if(sess.getUserId() === session.getUserId()){
					_this._sessions.splice(index, 1);
				}
			});
		});
	}

	removeAll(){
		this.removeSession(...this._sessions);
	}
}

module.exports = Sync;
