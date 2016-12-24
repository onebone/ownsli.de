const express = require('express');
const router = express.Router();

/*router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});*/

router.get('/edit', (req, res, next) => {
	res.render('presentation/edit');
});

module.exports = router;
