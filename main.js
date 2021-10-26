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
//群聊消息队列
var groupMessage=[
    {
        sender:'admin',
        time:new Date().toLocaleString(),
        content:"你好，世界"
    },
    {
        sender:'user1',
        time:new Date().toLocaleString(),
        content:"世界,你好"
    }
];
//当前用户名
var nowUsername="";
//登录门闸
var isLogin=false;

// -----------




const urlencoded=bodyParser.urlencoded({extends:false});

var failMsg;

app.use('/resources',express.static('resources'));
app.use('/root',express.static(__dirname));

app.get('/',function (req,res){
    res.sendFile(__dirname+'/views/login.html');
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
    res.sendFile(__dirname+'/views/login.html');
});
app.post('/login',urlencoded,function (req,res){
    let user=req.body;
    let userList=fs.readFileSync(__dirname+'/database/account.json').toString();
    userList=JSON.parse(userList);
    if(!userList[user.username]){
      failMsg='该用户不存在，请检查用户名是否正确';
        res.end(getLoginHTML(failMsg,user.username,user.password));
    }else if(userList[user.username].password!==user.password){
      failMsg='密码错误';
        res.end(getLoginHTML(failMsg,user.username,user.password));
    }else {
        //用户在线，提示用户已在线
        if(clients[user.username]){
            failMsg='用户已在线';
            res.end(getLoginHTML(failMsg,user.username,user.password));
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
    res.sendFile(__dirname+'/views/register.html');
});
app.post('/register',urlencoded,function (req,res){
    let regUser=req.body;
    let userList=fs.readFileSync(__dirname+'/database/account.json').toString();
    userList=JSON.parse(userList);
    let failMsg="";
    if(userList[regUser.username]){
        failMsg="该用户已注册";
        res.end(getRegHTML(failMsg));
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

        // 服务器接受消息
        client.on('sendMessage', function (msg) {
            console.log(`[${new Date().toLocaleString()}]:[${client.name}]${msg}`);
            let newMsg={
                sender:client.name,
                time:new Date().toLocaleString(),
                content:msg
            }
            groupMessage.push(newMsg);
            //更新所有客户端群聊消息
            io.emit('updateGroupMsg',groupMessage);
        });
});









// 获取登录失败后的重新登录的网页
function getLoginHTML(failMsg,oriUsername,oriPassWord){
 return `


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/resources/css/bootstrap.min.css">
    <script src="/resources/js/jquery-1.12.4.min.js"></script>
   <script src="/resources/js/login.js"></script>

    <title>登录</title>
</head>

<body style="text-align: center;">
<h1>nbPlus chatRoom用户登录</h1>
<form action="/login" method="post" style="width: 700px;display: inline-block;text-align: left" onsubmit="return formValidation()">
    <label for="username">账号:</label>
   <input type="text" name="username" id="username" class="form-control"><br>
    <label for="password">密码:</label>
    <input type="password" name="password" id="password" class="form-control"><br>
    <span id="failMsg" style="color: red">${failMsg}</span><br>
    <input type="submit" value="登录" class="btn btn-primary">
    <a href="/register"> <input type="button" value="没有账户?点击注册" class="btn btn-default"></a>
</form>
</body>
</html>
`


}

function getRegHTML(failMsg){
    return `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/resources/css/bootstrap.min.css">
    <script src="/resources/js/jquery-1.12.4.min.js"></script>
    <script src="/resources/js/register.js"></script>
    <title>注册</title>
</head>
<body style="text-align: center;">
<h1>nbPlus chatRoom用户注册</h1>
<form action="/register" method="post" style="width: 700px;display: inline-block;text-align: left" onsubmit="return regValidation()">
    <label for="username">账号:</label>
    <input type="text" name="username" id="username" class="form-control"><br>
    <label for="password">密码:</label>
    <input type="password" name="password" id="password" class="form-control"><br>
    <label for="repeatPsw">确认密码:</label>
    <input type="password" name="repeatPsw" id="repeatPsw" class="form-control"><br>
    <span id="failMsg" style="color: red">${failMsg}</span><br>
    <input type="submit" value="点击注册" class="btn btn-primary">
    <a href="/login"><input type="button" value="返回登录" class="btn btn-default"></a>
</form>

</body>
</html>
    
    `
}



//    <span id="failMsg" style="color: red">${failMsg}</span><br>

