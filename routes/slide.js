const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.render('slide/list');
});

router.get('/view/:id', (req, res, next) => {
	res.render('slide/view');
});

router.get('/present/:id', (req, res, next) => {
	//TODO Render presentation
	res.send('');
});

router.get('/edit/:id', (req, res, next) => {
	//TODO Send presentation data
	res.render('slide/editor');
});

module.exports = router;
