'use strict';

const {Document} = require('./document');
const {SessionManager} = require('./session');

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
	 * @param document Document|string  | Document which will be synced
	 * @param session optional Session  | Sessions which will be initialized
	 * @return boolean
	 */
	static createGroup(document, ...session){
		if(document instanceof Document){
			document = document.getId();
		}

		if(typeof document !== 'string'){
			return false;
		}

		session.forEach((sess) => {
			if(!sess) return;
			// TODO check if session already has group
			sess.__setGroup(document);
		});

		groups[document] = session;
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
			session.forEach((sess) => {
				sess.__setGroup(document);
				groups[document].push(sess);
			});
			return true;
		}
		return false;
	}

	/**
	 * Removes session from a group
	 * @param document Document
	 * @param sessions Session
	 * @return boolean
	 */
	static leaveSession(...sessions){
		sessions.forEach((session) => {
			const document = session.getGroup();
			groups[document].forEach((sess, index) => {
				if(!sess) return;

				if(sess.getUserId() === session.getUserId()){
					groups[document].splice(index, 1);
				}
			});
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
			groups[document].forEach((sess) => {
				if(!sess) return;

				sess.__setGroup(null);
			});

			delete groups[document];
			return true;
		}
		return false;
	}

	static getGroups(){
		return groups;
	}

	static resetGroups(){
		groups = {};
	}
}

module.exports = Sync;
