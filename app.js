require('./init');

const bodyParser = require('body-parser');
const chalk = require('chalk');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const httpErrors = require('./src/error');
const logger = require('morgan');
const path = require('path');
const preventInjection = require('./src/prevent-injection');
const requestLanguage = require('express-request-language');
const resolveLanguage = require('./src/resolve-language');
const session = require('express-session');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
	secret: '!@$13498!@(SD@(&%#@', // TODO
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 900000
	}
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLanguage({
	languages: config.langs
}));

app.use(httpErrors);
app.use(preventInjection);
app.use(resolveLanguage);

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
if(devmode){
	console.log(chalk.yellow('Warning: this app is running on development!'));
	app.use('/test', express.static(path.join(__dirname, 'test')));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
