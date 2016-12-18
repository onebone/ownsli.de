const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');

class Utils{
	static createToken(){
		return crypto.randomBytes(64).toString('hex');
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
}

module.exports = Utils;