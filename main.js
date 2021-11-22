const express=require('express');
const app=express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var ip=require('ip');

const bodyParser=require('body-parser');
const fs=require('fs');

// ---------数据域
//在线客户端
var clients={};
var onlineNameList={};
var onlineSize=0;
var groupMessage=JSON.parse(fs.readFileSync(__dirname+'/database/groupMessageHistory.json').toString());
//当前用户名
var nowUsername="";
//登录门闸
var isLogin=false;
// -----------




const urlencoded=bodyParser.urlencoded({extends:false});



app.use('/resources',express.static('resources'));
app.use('/root',express.static(__dirname));
app.use('/database',express.static('database'));
app.set('view engine','ejs');
app.set('views',__dirname+'/views');
// 登录参数
let loginDataEJS={
    failMsg:"",
    oriUsername:"",
    oriPassWord:""
}
//注册参数
let registerDataEJS={
    failMsg:""
}

app.get('/',function (req,res){
    res.render('login',loginDataEJS);
});
app.get('/chatRoom',function (req,res){
    if(isLogin){
        //放行
        res.sendFile(__dirname+'/views/chatRoom.html');
        //关登录门闸
        isLogin=false;
    }else{
        res.redirect('/');
    }

});




// 处理登录请求
app.get('/login',function (req,res){

    res.render('login',loginDataEJS);
});
app.post('/login',urlencoded,function (req,res){
    let user=req.body;
    let userList=fs.readFileSync(__dirname+'/database/account.json').toString();
    userList=JSON.parse(userList);
    loginDataEJS.oriUsername=user.username;
    loginDataEJS.oriPassWord=user.password;
    if(!userList[user.username]){
      loginDataEJS.failMsg='该用户不存在，请检查用户名是否正确';
        res.render('login',loginDataEJS);
    }else if(userList[user.username].password!==user.password){
      loginDataEJS.failMsg='密码错误';
        res.render('login',loginDataEJS);
    }else {
        //用户在线，提示用户已在线
        if(clients[user.username]){
            loginDataEJS.failMsg='用户已在线';
            res.render('login',loginDataEJS);
        }else{
            //开登录门闸
            isLogin=true;
            // 登录成功，进入聊天室
            nowUsername=user.username;
            res.redirect('/chatRoom');
        }
    }
});

//处理注册请求
app.get('/register',function (req,res){
    res.render('register',registerDataEJS);
});
app.post('/register',urlencoded,function (req,res){
    let regUser=req.body;
    let userList=fs.readFileSync(__dirname+'/database/account.json').toString();
    userList=JSON.parse(userList);
    if(userList[regUser.username]){
        registerDataEJS.failMsg="该用户已注册";
        res.render('register',registerDataEJS);
    }else{
        let newUser={
            username:regUser.username,
            password:regUser.password
        }
        userList[newUser.username]=newUser;
        fs.writeFileSync(__dirname+'/database/account.json',JSON.stringify(userList));
        // res.writeHead(200,{'content-type':'text/html;charset=utf-8'})
        res.send("注册成功,请重新登录<br><a href='/'>点我返回登录页面</a>");
    }

});



// 启动服务器
server.listen(8888,function (){
   console.log(`服务器已启动,地址为http://${ip.address()}:8888`);
});

//服务器检测到客户端连接
io.on('connection',function (client){
        //给客户端分配唯一name
        client.name = nowUsername;
        clients[client.name] = client;
        onlineNameList[client.name]=client.name;
        onlineSize++;
        // 刷新所有客户机在线列表
        io.emit('aMemberOn',onlineNameList);
        console.log(`[${new Date().toLocaleString()}]:[服务器]用户${client.name}加入聊天室。`);
        //客户端退出聊天室
        client.on('disconnect', function () {
            console.log(`[${new Date().toLocaleString()}]:[服务器]用户${client.name}退出聊天室。`);
            delete clients[client.name];
            delete onlineNameList[client.name];
            onlineSize--;
            //刷新所有客户机在线列表
            io.emit('aMemberOff',onlineNameList);
        });
        // 客户端初始化
        client.emit('init', {
            serverIP:ip.address(),//服务器ip
            username: client.name,//客户机名
            groupMessage:groupMessage,//同步群聊历史消息
            onlineSize:onlineSize//在线人数
        });
    //上一个时间片
    io.lastTime=new Date(groupMessage[groupMessage.length-1].time) ;
    io.lastTime.setSeconds(0);
    // 服务器接受消息
        client.on('sendMessage', function (msg) {
            console.log(`[${new Date().toLocaleString()}]:[${client.name}]${msg}`);
            //消息发送时间
            let sendTime=new Date();
            //该消息发送时是否需要显示时间
            let flag=false;
            //两消息间隔时间大于一分钟，显示时间
            if(sendTime-io.lastTime>=60*1000) {
                flag=true;
                io.lastTime=sendTime;//更新上一个时间片
                io.lastTime.setSeconds(0);
            }
            let newMsg={
                sender:client.name,
                content:msg,
                showTime:flag,
                time:sendTime,
                timeString:getTimeString(sendTime)
            }
            groupMessage.push(newMsg);
            //将更新后的消息记录写入文件
            let str=JSON.stringify(groupMessage);
            fs.writeFileSync(__dirname+"/database/groupMessageHistory.json",str);
            //更新所有客户端群聊消息
            io.emit('updateGroupMsg',groupMessage);
        });
});


//获取如2021/10/27 下午8:49的字符串
function getTimeString(date){
    return date.toLocaleString().substring(0,date.toLocaleString().lastIndexOf(":"));
}


