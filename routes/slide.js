const {DocumentManager} = require('../src/document');
const {SessionManager} = require('../src/session');
const {DocumentRenderer} = require('../src/renderer');
const archiver = require('archiver');
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

const serve = express.static(path.join(__dirname, '..', 'contents'));
const authenticatedServe = (regex) => {
	//DO NOT CHANGE THIS TO ARROW FUNCTION (because of this);
	return function(req, res, next){
		const match = req.originalUrl.match(regex);

		if(!match) return next();

		if(!req.session || !req.session.token) return res.redirect('/login');

		const session = SessionManager.getSession(req.session.token);

		if(session === null) return res.redirect('/login');

		DocumentManager.getDocument(match[1]).then(document => {
			if(document.getOwner() !== session.getUserId() && document.getInvitations().indexOf(session.getUserId()) === -1) return res.redirect('/login');
			serve.apply(this, arguments);
		});
	};
};
router.use('/edit', authenticatedServe(/^\/slide\/edit\/([a-zA-Z0-9]+)/));
router.use('/present', authenticatedServe(/^\/slide\/present\/([a-zA-Z0-9]+)/));

router.get('/present/:id', (req, res, next) => {
	if(!req.session || !req.session.token) return res.redirect('/login');
	const session = SessionManager.getSession(req.session.token);
	if(session === null) return res.redirect('/login');

	DocumentManager.getDocument(req.params.id).then(document => {
		if(!document){
			return;
		}

		if(document.getOwner() !== session.getUserId() && document.getInvitations().indexOf(session.getUserId()) === -1)
			return res.redirect('/login');

		let renderer = DocumentRenderer;
		if(devmode){
			delete require.cache[require.resolve('../src/renderer.js')];
			renderer = require('../src/renderer.js').DocumentRenderer;
		}

		try{
			fs.mkdirSync(path.join(__dirname, '..', 'contents', document.getId()));
		}catch(e){
			if(e.code !== 'EEXIST') return res.json({
				res: false
			});
		}
		const impressLocation = path.join(__dirname, '..', 'contents', document.getId(), 'impress.js');
		fs.access(impressLocation, fs.F_OK | fs.R_OK, (err) => {
			if(err){
				fs.createReadStream(path.join(__dirname, '..', 'bower_components', 'impress-js', 'js', 'impress.js')).pipe(
					fs.createWriteStream(impressLocation)
				).on('finish', () => res.status(200).type('html').send((new renderer(document.toArray())).render()));
			}else{
				res.status(200).type('html').send((new renderer(document.toArray())).render());
			}
		});
	}).catch((err) => {
		console.error(err);
	});
});

const ID_REGEX = /^[a-zA-Z0-9]+$/;
router.get('/export/:id', (req, res, next) => {
	if(typeof req.params.id !== 'string') return;
	if(!req.session || !req.session.token) return res.redirect('/login');
	const session = SessionManager.getSession(req.session.token);
	if(session === null) return res.redirect('/login');

	DocumentManager.getDocument(req.params.id).then(document => {
		if(!document){
			return;
		}

		if(document.getOwner() !== session.getUserId() && document.getInvitations().indexOf(session.getUserId()) === -1)
			return res.redirect('/login');	// TODO: Maybe forbidden page is better?

		if(!ID_REGEX.test(req.params.id)) return; //TODO I don't think that this is not needed but just added.

		const archive = archiver('zip', {store: true});
		archive.pipe(res.status(200).set({
			'Content-Disposition': `attachment; filename="exported-slide-${document.getName()}.zip"`,
			'Content-Type': 'application/octet-stream'
		}));
		archive.directory(path.join(__dirname, '..', 'contents', req.params.id), '/');
		archive.append((new DocumentRenderer(document.toArray())).render(), {name: 'slide.html'});
		archive.finalize();
	}).catch((err) => {
		console.error(err);
	});
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
			res.render('slide/editor', {
				slideTitle: document.getName(),
				slideId: document.getId(),
				slideOwner: document.getOwner(),
				slideLastEdit: document.getLastSave()
			});
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
