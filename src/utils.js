const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');

const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

class Utils{
	static createToken(len = 64){
		let str = '';
		for(let i = 0; i < len; i++){
			str += letters[Utils.rand(0, letters.length - 1)];
		}
		return str;
	}

	/**
	 * Encrypts password with bcrypt
	 *
	 * @param password
	 *
	 * @return Promise
	 */
	static encrypt(password){
		return new Promise((resolve, reject) => {
			bcrypt.hash(password, bcrypt.genSaltSync(), null, (err, hash) => {
				if(err) return reject(err);

				resolve(hash);
			});
		});
	}

	/**
	 * Compares two strings
	 * @param data
	 * @param hash
	 * @return Promise
	 */
	static compareHash(data, hash){
		return new Promise((resolve, reject) =>{
			bcrypt.compare(data, hash, (err, res) => {
				if(err) return reject(err);

				resolve(res);
			});
		});
	}

	/**
	 * @param min
	 * @param max
	 */
	static rand(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

module.exports = Utils;