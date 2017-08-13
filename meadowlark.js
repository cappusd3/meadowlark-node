var express = require('express');
var fortune = require('./lib/fortune');
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');

var credentials = require('./credentials.js');

var app = express();

// 设置 handlebars视图引擎
// 创建了一个视图引擎，并对 Express 进行了配置，将其作为默认的视图引擎
var handlebars = require('express-handlebars').create({
    partialsDir: 'views/partials',
    layoutsDir: "views/layouts/",
    defaultLayout: 'main',
    // extname: '.hbs',
    helpers: {
        section: function(name, options) {
            if(!this._sections) {
                this._sections = {}
            }
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);


// 添加日志支持
switch(app.get('env')) {
    case 'development':
        // 紧凑的，彩色的开发日志
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // 模块 'express-logger' 支持按日志循环
        app.use(require('express-logger') ({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

// static 中间件可以将一个或多个目录指派为包含静态资源的目录，
// 其中的资源不经过任何 特殊处理直接发送到客户端。你可以在其中放图片、CSS 文件、客户端 JavaScript 文件之 类的资源。
app.use(express.static(__dirname + '/public'));

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));

app.use(require('body-parser')())

// flash message middleware
app.use(function(req, res, next){
	// if there's a flash message, transfer
	// it to the context, then clear it
	res.locals.flash = req.session.flash;
    console.log('================')
    console.log(res.locals.flash)
    console.log('================')
	delete req.session.flash;
	next();
});

// mock weather data
function getWeatherData() {
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)', 
            },
        ]
    };
}

// middleware to add weather data to context
app.use(function(req, res, next) {
	if(!res.locals.partials) res.locals.partials = {};
    // res.locals.partials.weather = getWeatherData(); 这里命名为 weather 报错
 	res.locals.partials.weatherContext = getWeatherData();
 	next();
});

// 请求报头信息
app.get('/headers', function(req,res) {
    res.set('Content-Type','text/plain');
    var s='';
    for(var name in req.headers) {
        s += name + ': ' + req.headers[name] + '\n';
    }
    console.log('客户端的 IP 地址: ' + req.ip);
    res.send(s);
});

app.get('/', function(req, res) { 
    // res.type('text/plain');
    // res.send('Meadowlark Travel');
    res.render('home');
});

app.get('/about', function(req, res) {
    // 不再指定内容类型和状态码, 因为视图引擎默认会返回 text/html 的内容类型和 200 的状态码。
    res.render('about', { fortune: fortune.getFortune() });
});

app.get('/jquery-test', function(req, res){
	res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

app.get('/newsletter', function(req, res){
    // 我们会在后面学到 CSRF......目前，只提供一个虚拟值 
    res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/process', function(req, res){
    // Express 提供了两个方便的属性:req.xhr 和 req.accepts。
    // 如果是 AJAX 请求(XHR 是 XML HTTP请求的简称，AJAX依赖于XHR)，req.xhr值为true
    // req.accepts试图确 定返回的最合适的响应类型
    if(req.xhr || req.accepted('json,html') === 'json') {
        res.send({ success: true });
    } else {
        res.redirect(303, '/thank-you');
    }
});

app.get('/thank-you', function(req, res){
	res.render('thank-you');
});

app.get('/contest/vacation-photo', function(req,res) {
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});

// 简单的方法是创建一个时间戳目录来存储文件。更实际的做法是使用用户 ID 或其他唯一 ID 来创建子目录
app.use('/upload', function(req, res, next) {
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function() {
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function() {
            return '/uploads/' + now;
        },
    })(req, res, next);
});

app.get('/newsletter', function(req, res){
	res.render('newsletter');
});

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){ }
NewsletterSignup.prototype.save = function(cb) {
    cb();
};

var VALID_EMAIL_REGEX = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
app.post('/newsletter', function(req, res) {
    var name = req.body.name || '', email = req.body.email || '';
    // 输入验证
    console.log('##################')
    console.log(req.body)
    console.log('##################')
    if(!VALID_EMAIL_REGEX.test(email)) {
        if(req.xhr) return res.json({ error: 'Invalid name email address.' });
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsletterSignup({ name: name, email: email }).save(function(err) {
        if(err) {
            if(req.xhr) return res.json({ error: 'Database error.' });
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            }
            return res.redirect(303, '/newsletter/archive');
        }
        if(req.xhr) return res.json({ success: true });
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/newsletter/archive');
    });
});

// 购物车验证
var cartValidation = require('./lib/cartValidation.js'); 
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);


//定制404页面
app.use(function(req, res) {
    // res.type('text/plain');
    // res.send('404 - not found');
    res.status(404);
    res.render('404');
});

// 定制500页面
app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function() {
    console.log( 'Express started in ' + app.get('env') +
            ' mode on http://localhost:' + app.get('port') +
            '; press Ctrl-C to terminate.' );
});


// 疑点：
// 1. app.get --- app.use 区别 ？