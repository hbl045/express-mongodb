const express = require('express'),
    {user, task} = require('../model/sch'),
    crypto = require('crypto'),
    router = express.Router();

/*
  0 成功
  1 失败
  2 服务网错误
  3 ......
* */

router.get('/', function (req, res) {
    res.render('index', {
        login: req.session.login,
        user: req.session.user,
        title: '首页'
    })
});

router.get('/reg', function (req, res) {
    res.render('reg',{
        title: '注册页面'
    })
}).post('/reg', function (req, res) {
    console.log(req.body);
    user.findOne({username: req.body.username}).then((data) => {
        if (data) {
            return res.send({code: 2, msg: '用户已存在'})
        }
        const c = crypto.createHash('sha256'); // 1. 指定用什么方式加密
        const password = c.update(req.body.password).digest('hex'); // 2. 加密
        user.create({
            username: req.body.username,
            password: password
        }).then((data) => {
            res.send({
                code: 1, msg: '注册成功',
            })
        }).catch(function(err){
            console.log(err);
        })
    }).catch(function(err){
        console.log(err);
    });
});

router.get('/login', function (req, res) {
    console.log(req.session.login);
    res.render('login', {
        login: req.session.login,
        title: '首页'
    });
}).post('/login', function (req, res) {
    // 1. 用户名存不存在
    user.findOne({username: req.body.username}, function (err, data) {
        console.log(data);
        if (data) {
            const c = crypto.createHash('sha256'); // 1. 指定用什么方式加密
            const password = c.update(req.body.password).digest('hex'); // 2. 加密
            if (data.password === password) {
                req.session.login = true;
                req.session.user = data;
                return res.send({code: 0, msg: '登陆成功'})
            }
            return res.send({msg: '密码错误'})
        }
        res.send({msg: '用户不存在'})
    })
});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

// 给所有的路由设置, 在想设置的路由前面

/*router.use(function (req, res, next) {
  if (req.session.user.level >= 10) {
    return next()
  }
  res.send('没有权限');
});*/
// 给单独的某一个路由设置
/*router.get('/admin', function (req, res, next) {
  if (req.session.user.level >= 10) {
    return next()
  }
  res.send('没有权限');
}, function (req, res) {
  res.send('假装这里是后台')
});*/

/*router.get('/admin', function (req, res) {
  res.send('假装这里是后台')
});

router.get('/admin/goudan', function (req, res) {
  res.send('goudan')
});*/

router.get('/xq/:id', function (req, res) {
    task.findOne({_id: req.params.id}).populate('author receiver.user').exec(function (err, data) {
        console.log(data);
        const a = data.receiver.findIndex(function (val) {
            // 如果等于 代表当前登录的用户 在已经接取的数组里
            // -1 没有接取  其他所有 已经几区
            return String(val._id) === req.session.user && req.session.user._id
        });
        res.render('xq', {
            title: '详情页 - ' + data.title,
            user: req.session.user,
            login: req.session.login,
            data: data,
            a
        })
    })
});
router.post('/xq/:id', function (req, res) {
    Promise.all([
        task.updateOne({_id: req.params.id}, {$push: {receiver: {user: req.session.user._id} }}),
        user.updateOne({_id: req.session.user._id}, {$push: {'task.receive': req.params.id}})
    ]);
});
router.post('/task/finmsg', function (req, res) {
    task.updateOne({_id: '5c471535d2721c02e03928ea'},
        {$set: {
                ['receiver.' + req.body.index + '.msg']: req.body.msg},
            ['receiver.' + req.body.index + '.finmsg']: true
        }).then()
});

module.exports = router;
