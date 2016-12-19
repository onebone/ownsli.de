const express = require('express');
const router = express.Router();

const {AccountManager} = require('../src/account');
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
// Other user is already logged in
// Session already exists with same userId
const ERROR_OTHER_ALREADY_LOGGED_IN = 3;
// Already logged in
const ERROR_ALREADY_LOGGED_IN = 4;

router.get('/', function(req, res) {
	res.render('login/index', { // TODO: Improve front end
		title: 'Login'
	});
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
			if(SessionManager.getSessionByUserId(userId) !== null){
				return res.send(JSON.stringify({
					status: true,
					error: true,
					errCode: ERROR_OTHER_ALREADY_LOGGED_IN
				}));
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
		console.log(err);
		res.send(JSON.stringify({
			status: true,
			error: true,
			errCode: ERROR_SERVER_SIDE
		}));
	});
});


// test //
router.get('/create', (req, res) => {
	const userId = req.query.userId;
	const password = req.query.password;

	if(!userId || !password){
		res.send('not set');
		return;
	}

	AccountManager.createAccount(userId, password).then(() => res.send('success')).catch((err) => res.send('err ' + err));
});
// test end //

module.exports = router;
