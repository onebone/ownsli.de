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

const sess = session({
	secret: '!@$13498!@(SD@(&%#@', // TODO
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 900000
	}
});
app.use(sess);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(requestLanguage({
	languages: config.langs
}));

app.use((req, res, next) => {
	res.locals.url = req.url;
	next();
});

app.use(httpErrors);
app.use(preventInjection);
app.use(resolveLanguage);

app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/slide', require('./routes/slide'));

if(devmode){
	console.log(chalk.yellow('Warning: this app is running on development mode!'));
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

const debug = require('debug')('ownsli.de:server');
const http = require('http');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

require('./src/sync.js').setServer(server, sess);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug('Listening on ' + bind);
}
