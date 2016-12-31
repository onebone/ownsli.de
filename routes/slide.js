const {DocumentManager} = require('../src/document');
const {SessionManager} = require('../src/session');
const multer = require('multer');
const Sync = require('../src/sync');

const TITLE_REGEX = /^.{1,100}$/;

const router = require('express').Router();

router.get('/', (req, res, next) => {
	if(!req.session || !req.session.token || SessionManager.getSession(req.session.token) === null){
		res.redirect('/login');
		return;
	}

	res.render('slide/list');
});

router.get('/view/:id', (req, res, next) => {
	//TODO Send presentation data
	res.render('slide/view');
});

router.get('/present/:id', (req, res, next) => {
	//TODO Render presentation
	res.send('');
});

router.post('/create/', (req, res, next) => {
	if(!(req.session && req.session.token)) return next(res.locals.e('error.nosession', 403, {
		redirect: '/login'
	}));

	if(!req.body.title || !TITLE_REGEX.test(req.body.title)) return next(res.locals.e('error.wrongtitle', 400));

	const session = SessionManager.getSession(req.session.token);
	DocumentManager.addDocument(session.getUserId(), req.body.title).then((id) => {
		res.redirect(`/slide/edit/${id}`);
	});
});

//TODO upload resource
router.post('/upload/:id', (req, res, next) => {

});

router.get('/share/:id/:user', (req, res, next) => {
	//TODO Add sharing function
});

router.get('/edit/:id', (req, res, next) => {
	if(typeof req.params.id !== 'string') return; // just quit; do not give anything

	if(!req.session || !req.session.token) return res.redirect('/login');

	const session = SessionManager.getSession(req.session.token);

	if(session === null) return res.redirect('/login');

	DocumentManager.getDocument(req.params.id).then(document => {
		if(!document){
			return;
		}

		if(Sync.createGroup(document, session)){
			res.render('slide/editor');
		}else{
			// TODO: render document does not exist...
		}
	}).catch(console.error);
});

module.exports = router;
