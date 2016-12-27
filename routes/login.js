const express = require('express');
const router = express.Router();

const {AccountManager, NoAccountError, AccountAlreadyExistError} = require('../src/account');
const {SessionManager} = require('../src/session');

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
// Account already exists
// Account with same user Id already exists
const ERROR_ACCOUNT_ALREADY_EXIST = 3;
// Already logged in
const ERROR_ALREADY_LOGGED_IN = 4;

router.get('/', function(req, res, next) {
	res.render('login/index', { // TODO: Improve front end
		title: 'Login'
	});
});

router.post('/', (req, res, next) => {
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

	if(req.session.token){
		const session = SessionManager.getSession(req.session.token);

		if(session !== null){
			return res.send(JSON.stringify({
				status: true,
				error: true,
				errCode: ERROR_ALREADY_LOGGED_IN
			}));
		}
	}

	AccountManager.comparePassword(userId, password).then((result) => {
		if(result){
			let sess;
			if((sess = SessionManager.getSessionByUserId(userId)) !== null){
				SessionManager.removeSession(sess.getToken());
			}
			const session = SessionManager.addSession(userId);

			req.session.token = session.getToken();

			res.send(JSON.stringify({
				status: true,
				error: false
			}));
		}else{
			res.send(JSON.stringify({
				status: true,
				error: true,
				errCode: ERROR_INVALID_DATA
			}));
		}
	}).catch((err) => {
		if(err instanceof NoAccountError){
			return res.send(JSON.stringify({
				status: true,
				error: true,
				errCode: ERROR_INVALID_DATA
			}));
		}

		res.send(JSON.stringify({
			status: true,
			error: true,
			errCode: ERROR_SERVER_SIDE
		}));
	});
});

router.post('/create', (req, res, next) => {
	const userId = req.body.userId;
	const password = req.body.password;

	if(!userId || !password
	|| typeof userId !== 'string' || typeof password !== 'string'){
		res.send(JSON.stringify({
			status: true,
			error: true,
			errCode: ERROR_INVALID_FORM
		}));
		return;
	}

	AccountManager.createAccount(userId, password).then(() =>
		res.send(
		JSON.stringify({
			status: true,
			error: false,
		}))
	).catch((err) => {
		if(err instanceof AccountAlreadyExistError){
			res.send(JSON.stringify({
				status: true,
				error: true,
				errCode: ERROR_ACCOUNT_ALREADY_EXIST
			}));
		}else{
			res.send(JSON.stringify({
				status: true,
				error: true,
				errCode: ERROR_SERVER_SIDE
			}))
		}
	});
});

module.exports = router;
