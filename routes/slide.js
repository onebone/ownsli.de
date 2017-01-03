const {DocumentManager} = require('../src/document');
const {SessionManager} = require('../src/session');
const fs = require('fs');
const express = require('express');
const sanitize = require('sanitize-filename');
const multer = require('multer');
const path = require('path');
const Sync = require('../src/sync');

const TITLE_REGEX = /^.{1,100}$/;

const router = express.Router();

router.get('/', (req, res, next) => {
	if(!req.session || !req.session.token || SessionManager.getSession(req.session.token) === null){
		res.redirect('/login');
		return;
	}

	res.render('slide/list');
});

router.get('/view/:id', (req, res, next) => {
	if(!req.session || !req.session.token) return res.redirect('/login');
	const session = SessionManager.getSession(req.session.token);
	if(session === null) return res.redirect('/login');

	DocumentManager.getDocument(req.params.id).then(document => {
		if(!document){
			return;
		}

		if(document.getOwner() !== session.getUserId() && document.getInvitations().indexOf(session.getUserId()) === -1)
			return res.redirect('/login'); // TODO: Maybe forbidden page is better?

		res.render('slide/view', {
			slideTitle: document.getName(),
			slideId: document.getId(),
			slideOwner: document.getOwner(),
			slideLastEdit: document.getLastSave()
		});
	}).catch((err) => {
		console.error(err);
	});
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

router.get('/share/:id/:user', (req, res, next) => {
	//TODO Add sharing function
});

const serve = express.static(path.join(__dirname, '..', 'contents'));
router.use('/edit', function(req, res, next){
	const match = req.originalUrl.match(/^\/slide\/edit\/([a-zA-Z0-9]+)/);

	if(!match) return next();

	if(!req.session || !req.session.token) return res.redirect('/login');

	const session = SessionManager.getSession(req.session.token);

	if(session === null) return res.redirect('/login');

	let group;
	if(session.getGroup() && (group = Sync.getGroup(session.getGroup()))){
		const id = group.getDocument().getId();
		if(id !== match[1]) res.redirect('/login');
		serve.apply(this, arguments);
	}else next();
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

const upload = multer({dest: path.join(__dirname, '..', 'temp/')})
router.post('/upload', upload.single('uploadFile'), (req, res, next) => {
	if(!req.session || !req.session.token) return res.redirect('/login');
	const session = SessionManager.getSession(req.session.token);
	if(session === null) return res.redirect('/login');
	if(!req.file) return res.status(400).send('No files uploaded!');
	let group;
	if(session.getGroup() && (group = Sync.getGroup(session.getGroup()))){
		try{
			fs.mkdirSync(path.join(__dirname, '..', 'contents', group.getDocument().getId()));
		}catch(e){
			if(e.code !== 'EEXIST') return res.json({
				res: false
			});
		}
		const dest = path.join(__dirname, '..', 'contents', group.getDocument().getId(), sanitize(req.file.originalname));
		fs.rename(req.file.path, dest, (err) => {
			if(err) return res.json({
				res: false
			});

			res.json({
				res: true
			});
		});
	}
});

module.exports = router;
