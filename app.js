const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const methodOverride = require('method-override')
const assert = require('assert');


require('dotenv').load();

global.fs = require('fs');
global.path = require('path');
global.url = require('url');
global.assert = require('assert');
global.bcrypt = require('bcrypt');
global.randomString = require('randomstring');

//	config debug
var debug = require('debug');
// console.debug = console.log
Object.keys(console).forEach((v)=>{
	d =  debug(`oott:${v}`);
	debug[v] = console.log.bind(console);
	console[v] = d;
})

global.cservice = require("./apn")

global.DM = require('./locale/en/display_messages').APP_MESSAGES;
global.LPP = parseInt(process.env.LPP)

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

fs.readdirSync('./app/models').forEach(function(file) {
		var model = file.split('.')[0];
		if(model) require('./app/models/' + model);
});

mongoose.set('debug', true);
global.FX = require('./app/functions/functions.js');

global.moment = require('moment')
global.ObjectId = mongoose.Types.ObjectId;
global.SALT_WORK_FACTOR = 10;
global.UPLOAD_PATH = process.env.UPLOAD_PATH
global.IMAGE_BASE = process.env.IMAGE_BASE


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(multipart());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, os_type, version, ssid, access_token ");
  next();
});
app.use(methodOverride())

// app.use(logErrors)
// app.use(clientErrorHandler)
// app.use(errorHandler)
app.use('*', (req, res, next)=>{
	var api = req.baseUrl.split('/')[1];
	console.dir({ api: api,  body: req.body, params: req.params});
		next()
});
app.use(require("./routes/staticContent"));
app.use('/',  require('./routes/index'));
app.use(require("./routes/apiRoutes"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {

	var err = new Error('Not Found');
	err.status = 404;
	next(err);

});

// error handler
app.use(function(err, req, res, next) {
	console.error("app error handler called",err);
	// set locals, only providing error in development
	//locals will get as varible on view page eg message, error varible
	// res.locals.message = err.message;
	// res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	// res.status(err.status || 500);
	// errorMessage =  err.status ? err.message : DM.server_error;
	console.log(err.strack);
	// if(req.app.get('env') === 'development') throw new Error(err);
	var	errorMessage = '';
	if(err.name == 'ValidationError')
		//Loop over the errors object of the Validation Error
		Object.keys(err.errors).forEach(function(field) {
				var eObj = err.errors[field]
					errorMessage +=  eObj.message.replace('Path', '');
			});
	else
			errorMessage += err.message
	return res.status(203).json({ type: false, message: errorMessage })

});

module.exports = app;

// pending suggested, on follow/unfollow update, direct on group screen

//	complete  comment list, business view groups list, create groups, loggin user friends, update mesg on activities api
//
