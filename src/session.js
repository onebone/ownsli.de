'use strict';

const Utils = require('./utils');

const sessions = new Map();

class SessionManager{
	/**
	 * Add online session
	 *
	 * @param userId
	 * @return Session
	 */
	static addSession(userId){
		const token = Utils.createToken();
		return sessions[token] = new Session(userId, token);
	}

	/**
	 * Removes session with token.
	 *
	 * @param token
	 * @return boolean
	 */
	static removeSession(token){
		if(sessions[token]){
			const session = sessions[token];
			require('./sync').leaveSession(session); // wtf...

			sessions.delete(token);
			return true;
		}

		return false;
	}

	/**
	 * Returns session matching with certain userId
	 *
	 * @param userId
	 * @return Session
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
	 * @return Session
	 */
	static getSession(token){
		if(sessions[token]) return sessions[token];
		return null;
	}
}

class Session{
	constructor(userId, token, creationTime = Date.now()){
		this._userId = userId.toLowerCase();
		this._token = token;
		this._creationTime = creationTime;
		this._group = null;
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

	/**
	 * @param {string|null} group
	 */
	__setGroup(group){
		this._group = group;
	}

	getGroup(){
		return this._group;
	}
}

module.exports = {SessionManager, Session};
