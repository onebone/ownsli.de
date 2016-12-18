const express = require('express');
const router = express.Router();

const {AccountManager} = require('../src/account');

// login error

// Invalid form data was given
// eg) user id or password is empty
const ERROR_INVALID_FORM = 0;
// Invalid authenticate data
// Password is invalid or user does not exist
const ERROR_INVALID_DATA = 1;
// Server processing error
// Cannot compare password or create account due to error
const ERROR_SERVER_SIDE = 2;

router.get('/', function(req, res) {
	res.render('login');
});

router.post('/', (req, res) => {
	const userId = req.body.userId;
	const password = req.body.password;

	if(!userId || !password
		|| typeof userId !== 'string' || typeof password !== 'string'){
		return res.send(JSON.stringify({
			status: true,
			error: true,
			errCode: ERROR_INVALID_FORM
		}));
	}

	AccountManager.comparePassword(userId, password).then((result) => {
		res.send(JSON.stringify({
			status: true,
			error: result,
			errCode: result ? ERROR_INVALID_DATA : undefined
		}));
	}).catch(() => {
		res.send(JSON.stringify({
			status: true,
			error: true,
			errCode: ERROR_SERVER_SIDE
		}));
	});
});


// test
/*router.get('/test', (req, res) => {
	const userId = req.query.userId;
	const password = req.query.password;

	if(!userId || !password){
		res.send('not set');
		return;
	}

	AccountManager.comparePassword(userId, password).then((result) => {
		res.send(result);
	}).catch((err) => res.send('error: ' + err));
});

router.get('/create', (req, res) => {
	const userId = req.query.userId;
	const password = req.query.password;

	if(!userId || !password){
		res.send('not set');
		return;
	}

	AccountManager.createAccount(userId, password).then(() => res.send('success')).catch((err) => res.send('err ' + err));
});*/

module.exports = router;
