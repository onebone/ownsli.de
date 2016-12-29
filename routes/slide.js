const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
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

router.get('/create/', (req, res, next) => {
	//TODO Create new slide and redirect to editor
});

router.get('/share/:id/:user', (req, res, next) => {
	//TODO Add sharing function
});

router.get('/edit/:id', (req, res, next) => {
	//TODO Send presentation data
	res.render('slide/editor');
});

module.exports = router;
