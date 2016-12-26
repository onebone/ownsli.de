'use strict';

const Utils = require('./utils');

const sessions = new Map();

class SessionManager{
	/**
	 * Add online session
	 *
	 * @param userId
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

	/**
	 * Returns session matching with certain userId
	 *
	 * @param userId
	 * @returns Session
	 */
	static getSessionByUserId(userId){
		userId = userId.toLowerCase();

		for(const token in sessions){
			if(sessions.hasOwnProperty(token)){
				const session = sessions[token];
				if(session.getUserId() === userId){
					return session;
				}
			}
		}

		return null;
	}

	/**
	 * Returns session matching with certain token
	 *
	 * @param token
	 * @returns Session
	 */
	static getSession(token){
		for(const token in sessions){
			if(sessions.hasOwnProperty(token)){
				const session = sessions[token];
				if(session.getToken() === token){
					return session;
				}
			}
		}
		return null;
	}
}

class Session{
	constructor(userId, token, creationTime = Date.now()){
		this._userId = userId.toLowerCase();
		this._token = token;
		this._creationTime = creationTime;
	}

	getUserId(){
		return this._userId;
	}

	getToken(){
		return this._token;
	}

	getCreationTime(){
		return this._creationTime;
	}
}

module.exports = {SessionManager, Session};
