'use strict';

const Utils = require('./utils');

const sessions = {};

class SessionManager{
	/**
	 * Add online session
	 *
	 * @param userId
	 * @param token
	 * @returns {Session}
	 */
	static addSession(userId){
		const token = Utils.createToken();
		return sessions[token] = new Session(userId, token);
	}

	/**
	 * Removes session with token.
	 *
	 * @param token
	 * @returns {boolean}
	 */
	static removeSession(token){
		if(sessions[token]){
			sessions.delete(token);
			return true;
		}

		return false;
	}
}

class Session{
	constructor(userId, token){
		this._userId = userId;
		this._token = token;
	}

	getUserId(){
		return this._userId;
	}

	getToken(){
		return this._token;
	}
}

module.exports = SessionManager;