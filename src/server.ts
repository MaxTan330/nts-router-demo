/**
 * @Author: MaxTan
 * @Description: 服务启动入口配置文件
 * @Date: 2019/09/04 15:24:20
 */
import { Server } from './app';
const server = new Server();
//初始化服务
server.init();
//启动服务
server.app.listen(3000, () => {
    console.log(`server listening on port 3000 at time:${new Date()}`);
});
