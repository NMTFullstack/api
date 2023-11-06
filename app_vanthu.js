var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser')
var cors = require('cors');
var logger = require('morgan');
var mongoose = require('mongoose')

var AppVanthu = express();

function configureApp(app) {
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    //app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static("/root/app/storage"));
    app.use(cors());

    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
}

function errorApp(app) {
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        next(createError(404));
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
}

// Cấu hình appVanthu
configureApp(AppVanthu);
//AppVanthu.use(logger('combined'))
var vanthuRouter = require('./routes/vanthu')
AppVanthu.use("/api", vanthuRouter);
errorApp(AppVanthu);

const DB_URL = 'mongodb://localhost:27017/api-base365';
mongoose.connect(DB_URL)
    .then(() => console.log('App Văn thư DB Connected!'))
    .catch(error => console.log('App Văn thư DB connection error:', error.message));

// Van thu
AppVanthu.listen(3005, () => {});