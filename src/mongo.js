'use strict';

const mongo = require('mongodb').MongoClient;

let db = null;
mongo.connect(`mongodb://${global.config.database.url || 'localhost'}:${global.config.database.port || 27017}/${global.config.database.database}`, (err, client) => {
	if(err) throw err;

	db = client;
	db.createCollection('account').catch((err) => {
		if(err) throw err;
	});

	db.createCollection('document').catch((err) => {
		if(err) throw err;
	});
});

class MongoConnection{
	static query(dbname, query, one = false){
		if(typeof dbname !== 'string') return false;

		if(one)
			return db.collection(dbname).find(query);
		else
			return db.collection(dbname).findOne(query);
	}

	static insert(dbname, query){
		return db.collection(dbname).insertOne(query);
	}
}

module.exports = MongoConnection;