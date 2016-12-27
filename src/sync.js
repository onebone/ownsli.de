'use strict';

const {Document} = require('./document');
const {SessionManager, Session} = require('./session');

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

		io.sockets.on('connection', (socket) => {
			const session = SessionManager.getSession(socket.request.session.token);

			if(session === null){
				return;
			}
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
