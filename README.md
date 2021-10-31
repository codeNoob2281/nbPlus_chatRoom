# nbPlus_chatRoom——一个简易的网页聊天室

### 一、技术要点
              
  
 1. 样式设计：主要采用bootstrap框架的UI样式。
 2. 数据存储：使用JSON文件存储，文件存储目录为/database/。
 3. 页面渲染：使用Vue2来渲染页面。
 4. 服务器搭建：采用node.js来搭建服务器，其中用到了express web框架(版本4.17.1)。
 5. 实时聊天的实现：使用socket.io(版本 4.3.1)类库来实现服务端和客户端双向实时通信。以下为该类库API文档:<br><a href="https://socket.io/docs/v4/server-api">socket.io服务端API文档</a><br><a href="https://socket.io/docs/v4/client-api">socket.io客户端API文档</a>
