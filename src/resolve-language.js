module.exports = (req, res, next) => {
	const _ = res.locals.e;
	var lang = config.langs[0];
	try{
		lang = req.language;
	}catch(err){
		console.error(err);
		next(_('err.500', 500));
		return;
	}
	req.language = res.locals.language = lang;
	res.locals.translator = require('./translator').generate(req);

	next();
};
