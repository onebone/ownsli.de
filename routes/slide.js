const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.render('slide/list');
});

router.get('/edit', (req, res, next) => {
	res.render('slide/editor');
});

module.exports = router;
