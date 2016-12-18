'use strict';

const MongoConnection = require('./mongo');
const Utils = require('./utils');
const assert = require('assert');

class AccountManager{
	static createAccount(userId, password){
		return new Promise((resolve, reject) =>{
			if(!userId || !password
				|| typeof userId !== 'string' || typeof password !== 'string'){
				return reject(new InvalidDataTypeError());
			}


			Utils.encrypt(password).then((hash) => {
				MongoConnection.insert('account', {
					userId: userId,
					password: hash,
					registerTime: Date.now(),
					lastLogin: Date.now()
				}).then(() => resolve()).catch(() => reject());
			}).catch((err) => reject(err));
		});
	}

	static comparePassword(userId, password){
		return new Promise((resolve, reject) => {
			AccountManager.getAccount(userId).then((account) => {
				Utils.compareHash(password, account.getHash()).then((res) => resolve(res)).catch((err)=>reject(err));
			}).catch((err) => reject(err));
		});
	}

	static getAccount(userId){
		return new Promise((resolve, reject) => {
			if(typeof userId !== 'string') return reject(new InvalidDataTypeError());
			MongoConnection.query('account', {
				userId: userId
			}, true).toArray((err, docs) =>{
				if(err) return reject(err);
				if(docs.length < 1) return reject(new NoAccountError());

				resolve(new Account(docs[0].userId, docs[0].password, docs[0].registerTime, docs[0].lastLogin));
			});
		});
	}
}

class Account{
	constructor(userId, hash, registerTime, lastLogin){
		this._userId = userId;
		this._hash = hash;
		this._registerTime = registerTime;
		this._lastLogin = lastLogin;
	}

	getUserId(){
		return this._userId;
	}

	getHash(){
		return this._hash;
	}

	getRegisterTime(){
		return this._registerTime;
	}

	getLastLogin(){
		return this._lastLogin;
	}
}

class InvalidDataTypeError extends Error{
	constructor(){
		super('invalid data type');
	}
}

class NoAccountError extends Error{
	constructor(){
		super('no account');
	}
}

class HashCompareError extends Error{
	constructor(){
		super('cannot compare password hash');
	}
}

class IncorrectPasswordError extends Error{
	constructor(){
		super('incorrect password was given');
	}
}

module.exports = {
	Account, AccountManager, InvalidDataTypeError, NoAccountError, HashCompareError, IncorrectPasswordError
};