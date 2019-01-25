const mongoose = require('mongoose');

// 1. 防止一个月后只有上帝知道数据库里存了些什么
// 2. 类似于表单正则 验证往数据库里存放的数据是否符合要求
// 用户详情
const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    used: {type: Boolean, required: true, default: false}, // 账号是否可用
    // 普通用户 1    管理员 10  超级管理员 999
    level: {type: Number, required: true, default: 1},
    // 任务状态
    task: {
        // 发布的任务 [ 1, 2, 3, 4 ]
        publish: {type: [ {type: mongoose.Schema.Types.ObjectId, ref: 'task'} ]},
        // 已经接取的任务
        receive: {type: [ {type: mongoose.Schema.Types.ObjectId, ref: 'task'} ]},
        // 已经完成的
        accomplish: {type: [ {type: mongoose.Schema.Types.ObjectId, ref: 'task'} ]}
    }
});
// 任务详情
const taskSchema = new mongoose.Schema({
    title: {type: String}, // 标题
    content: {type: String}, // 内容
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'user'}, // 作者
    // 任务1 a   任务2 a   删除a      a b c  undefn b c
    // [ 1, 2, 3, 4 ]     [ {}, {}, {} ]
    receiver: {type: [ {
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
            msg: {type: String},
            finmsg: {type: Boolean, default: false} // 当前用户完成任务
        } ]}, // 接取人
    time: {type: String, default: new Date()}, // 发布时间
    num: {type: Number}, // 接取人数限制
    reward: {type: String}, // 奖励
    difficulty: {type: String}, // 难度
    expiration: {type: String}, // 截止日期
    can: {type: Boolean, required: true, default: false}// 任务是否已经完成
});

/*

{
  title: 123,
  author:
  msg: [
    {user: 1, msg: 'sdafasdfasdfas'},
    {user: 2, msg: 'sdafasdfasdfas'},
  ]
}

*/


// 创建表
const user = mongoose.model('user', userSchema);
const task = mongoose.model('task', taskSchema);

module.exports = {
    user,
    task
};
