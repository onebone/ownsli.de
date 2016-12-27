var async = require('async');

module.exports = (req, resp, next) => {
	var checkValue = (v, k, cb) => {
		cb(null, (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') ? '' + v : '');
	};
	//Anti SQL Injection
	async.each(['body', 'query', 'params', 'cookies'], (k, cb) => {
		async.mapValues(req[k], checkValue, (err, res) => {
			req[k] = res;
			cb(err);
		});
	}, (err) => {
		if(err) return next(err);
		next();
	});
};
