const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.render('slide/list');
});

router.get('/edit/:id', (req, res, next) => {
	//TODO Send presentation data
	res.render('slide/editor');
});

module.exports = router;
