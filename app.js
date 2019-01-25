const express = require('express'),
    app = express(),
    session = require('express-session'),
    Mongosession = require('connect-mongo')(session),
    mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost/a', { useNewUrlParser: true });

app.post('/test', function (req, res) {
    console.log(req.body);
    console.log(req.query);
})

// 使用方式   req.session.xxx = xxx
app.use(session({
    secret: 'alsdkfj',  //密钥 加密的内容
    rolling: true,  // 每次操作(刷新页面  点击a标签  ajax) 重新设定时间
    resave: false,   // 是否每次请求都重新保存数据
    saveUninitialized: false, // 初始值
    cookie: {maxAge: 1000 * 60 * 60}, //设置保存的时间
    store: new Mongosession({ // 存储的地址是哪里
        url : 'mongodb://localhost/a'
    })
}))


// 获取post参数
app.use(express.json());
app.use(express.urlencoded({extended: false}));
// 静态资源目录
app.use(express.static(__dirname + '/public'));
// 模板引擎
app.set('views', __dirname + '/view');
app.set('view engine', 'ejs');

app.use('/', require('./router/index.js'));
app.use('/api', require('./router/api.js'));
app.use('/admin', require('./router/admin.js'));

app.listen(233);

















