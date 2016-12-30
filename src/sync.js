'use strict';

const {Document} = require('./document');
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

			socket.emit('send data');

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

		groups[document.getId()] = new Group(document, ...sessions);
		return true;
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

		this._sessions.forEach((session) => {
			if(session.getGroup() !== null){
				Sync.getGroup(session.getGroup()).removeSession(session);
			}

			session.__setGroup(document.getId());
		});
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
