var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// DB 설정
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Session 설정
var session = require('express-session');
var fileStore = require('session-file-store')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-login',
  resave: false,
  saveUninitialized: false,
  store: new fileStore({
    path: './session',
    ttl: 24 * 60 * 60,
    reapInterval: 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// DB 연결
async function connectDB() {
    var databaseUrl = 'mongodb://localhost:27017/tictactoe';
    try {
        const database = await MongoClient.connect(databaseUrl);
        app.set('database', database.db('tictactoe'));

        // 연결 종료 처리
        process.on('SIGINT', async () => {
        await database.close();
        console.log('Database connection closed due to app termination');
        process.exit(0);
        });
    
        console.log('Connected to MongoDB');
    }   catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

connectDB().catch(err => {
  console.error(err);
  process.exit(1);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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

module.exports = app;