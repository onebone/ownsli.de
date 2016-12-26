module.exports = (req, res, next) => {
	res.locals.e = (errName, status, option) => {
		const translator = res.locals.translator || require('./translator').deflang;
		const err = new Error(res.locals.translator(errName));
		err.status = status;

		if(option.redirect) err.redirect = option.redirect;

		return err;
	};

	next();
};
