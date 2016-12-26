const {Document} = require('./document');

let io = null;
let groups = {};

class Sync{
	/**
	 * This function not for general use
	 * This should be called once when starting http
	 */
	static setServer(server){
		io = require('socket.io')(server);
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
	static leaveSession(document, ...sessions){
		if(document instanceof Document){
			document = document.getId();
		}

		if(typeof document !== 'string'){
			return false;
		}

		if(groups[document]){
			groups[document].forEach((sess, index) => {
				for(const session of sessions){
					if(sess.getUserId() === session){
						groups[document].splice(index, 1);
						break;
					}
				}
			});
		}
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
