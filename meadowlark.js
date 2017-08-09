var express = require('express');

var app = express();

// 设置 handlebars视图引擎
// 创建了一个视图引擎，并对 Express 进行了配置，将其作为默认的视图引擎
var handlebars = require('express-handlebars')
        .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

// static 中间件可以将一个或多个目录指派为包含静态资源的目录，
// 其中的资源不经过任何 特殊处理直接发送到客户端。你可以在其中放图片、CSS 文件、客户端 JavaScript 文件之 类的资源。
app.use(express.static(__dirname + '/public'));

var fortunes = [
    "Conquer your fears or they will conquer you.",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasant surprise.",
    "Whenever possible, keep it simple.",
];

app.get('/', function(req, res) { 
    // res.type('text/plain');
    // res.send('Meadowlark Travel');
    res.render('home');
});

app.get('/about', function(req, res) {
    var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    // 不再指定内容类型和状态码, 因为视图引擎默认会返回 text/html 的内容类型和 200 的状态码。
    res.render('about', { fortune: randomFortune});
});

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
    console.log('Express started on http://localhost:' + 
        app.get('port') + '; press Ctrl-C to terminate');
});


// 疑点：
// 1. app.get --- app.use 区别 ？