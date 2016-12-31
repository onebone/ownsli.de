var router = require('express').Router();

router.get('/', (req, res, next) => {
	if(!(req.session && req.session.token)) return res.redirect('/login');
	res.redirect('/slide');
});

module.exports = router;
