const express = require('express'),
    {user , task} = require('../model/sch'),//这里是坑 ，引入表，不然不存在
    crypto = require('crypto'),
    router = express.Router();

router.use(function (req, res, next) {//中间件，权限限制
    if (req.session.login) {
        if (req.session.user.level >= 10) {
            return next()
        }
        return res.send('没有权限')
    }
    res.send('没有登陆')
});

router.get('/user', function (req, res) {
    res.render('admin/user', {
        user: req.session.user,
        title: '用户管理'
    })

}).post('/user', function (req, res) {
    // 从第几个开始查找 查找多少个
    Promise.all([
        user.find().skip((req.body.page - 1) * req.body.limit).limit(Number(req.body.limit)),
        user.countDocuments(), // 总共有多少条数据
    ]).then(function (data) {
        // console.log(data[0], data[1]);
        // code 成不成功  data 数据  count 总共数据的条数
        res.send({code: 0, data: data[0], count: data[1]})
    })

    // 总共多少条 / 当前显示多少条
    // 第一页  1   每页显示10
    // (当前页数 - 1) * 每页显示多少条
    // 从第几个开始查找计算方式  (3 - 1) * 10
    // 1.   0 9
    // 2.   10 19
    // 3.   20 29

});
router.post('/user/reuserd', function (req, res) {
    // console.log(req.body.used);
    // console.log(typeof Boolean(req.body.used));
    user.findOne({_id: req.body.user_id}, function (err, data) {
        if (data.level >= 999) {
            return res.send({code: 1, data: '不能修改超级管理员'})
        }
        if (req.body.user_id !== req.session.user._id && data.level >= 999) {
            return res.send({code: 1, data: '不能修改别的管理员'})
        }
        user.updateOne({_id: req.body.user_id}, {$set: {used: req.body.used}}, function () {
            res.send({code: 0, data: '修改成功'})
        })
    });
});
// 不管删除 update更新 添加 查找
router.post('/user/del', function (req, res) {
    if(!req.body._id){
        return res.send({code:1 ,data:'参数不正确'})
    }
    // 需要完善判断信息 后台操作的需要
    user.findOne({_id:req.body._id}, function (err,data) {
        if(data.level >=999){
            return res.send({code:1, data:'不能删除超级管理员'})
        }
        if(data._id === req.session._id){
            return res.send({code:1, data:'不能删除自己'})
        }

        // 管理员之间不能互相删除
        if(req.session.user.level <999&&data.level >=10){
            return res.send({code:1,data:'不能删除管理员'})
        }
        Promise.all([
            user.deleteOne({_id: req.body._id}),
            task.deleteMany({author: req.body._id}),
            task.updateMany({receiver: req.body._id},{$pull: {receiver: req.body._id}})
        ]).then()
    })
    //  关联的文章/任务 删除 这里有坑，缺回调不执行


});
router.post('/user/relevel', function (req, res) {
    user.updateOne({_id: req.body._id}, {$set: { level: req.body.level }}, function (err, data) {
        if (err) {
            return res.send('数据库错误')
        }
    })
});

router.get('/task/add', function (req, res) {
    res.render('admin/addtask', {
        title: '发布',
        user: req.session.user
    })
});
router.post('/task/add', function (req, res) {
    const data = req.body;
    data.author = req.session.user._id;
    task.create(data, function (err, data) {
        if (err) {
            return res.send({code: 1, data: '数据库错误'})
        }
        // 发布的同时也要传递任务的id给 user记录发布的状态
        user.updateOne({_id: req.session.user._id}, {$push:{'task.publish' : data._id}}, function () {

        });
        res.send({code: 0, data: '保存成功'})
    })
});
router.get('/task/all', function (req, res) {
    res.render('admin/deltask',{
        title: '任务管理',
        user: req.session.user
    })
});


router.post('/task/del', function (req,res) {
    Promise.all([
        task.deleteOne({_id: req.body._id}),
        // 如果用户发布任务的数组中，有当前删除的任务 当前任务从数组中移除
        /*
   * if (task.publish || task.receive || task.accomplish) {
     删除用户表里的

   * */
        user.updateMany(
            {$or: [{'task.publish' : req.body._id },{'task.receiver' : req.body._id },{ 'task.accomplish' : req.body._id}]},
            {$pull: {'task.publish' : req.body._id , 'task.receiver' : req.body._id , 'task.accomplish' : req.body._id}}
        )
    ]).then();
})



module.exports = router;
