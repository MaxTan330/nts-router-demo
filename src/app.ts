/* eslint-disable @typescript-eslint/camelcase */
/**
 * @Author: MaxTan
 * @Description: 服务应用类
 * @Date: 2019/09/06 10:44:33
 */
import express from 'express';
import { Config } from './config/config';
import * as bodyParser from 'body-parser';
import { createConnection } from 'typeorm';
import { UserController } from './controllers/user';
import { allowOrigin, registerRouter } from '@maxtan/nts-router';
import { getLogger } from 'log4js';
const logger = getLogger();
import { RouterMiddleware } from './middleware/routerMiddleware';
export class Server {
    public app!: express.Application;
    /**
     * 初始化
     */
    public async init() {
        this.app = express();
        const mysqlConfig = new Config().mysqlOrm;
        createConnection(mysqlConfig).catch((err) => {
            logger.error(err);
        });
        const controllerStore = {
            user: new UserController(),
        };
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        const routerMiddleware = new RouterMiddleware();
        //允许跨域
        allowOrigin(this.app);
        //路由注册
        registerRouter(this.app, controllerStore, routerMiddleware);
    }
}
