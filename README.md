# nts-router

## 前言

最开始在 2017 年接触 Node 的时候，主要用来写些接口服务的，针对 js 的回调地狱，深有体会啊，尤其是你在同步逻辑需要处理异步操作的时候，不得不把同步包装成异步，即使 Primise 也很难让你写的顺心如意。在 Node 做服务应用的时候，我一直采用的 express 框架去做的，后面我觉得写法很不优雅，尤其是对我 MVC 的这种代码结构，痛点很多。有人网上提到，express 就是回调鸡肋，大部分都投入 koa、egg 的怀抱。我在工作中不断的发现这种问题，而后在一篇知乎的一篇文章[有趣的装饰器](https://zhuanlan.zhihu.com/p/87511653)中，得到了启发，有了 `nts-router`。在`有趣的装饰器`这篇文章，其实也踩了很多坑，尤其是在 this 引用这块。花了很多时间，解决了这个问题。随着 `nts-router` 的出现，这些问题统统解决。

## 简介

`nts-router` 是基于 Typescript 装饰器和 express 开发的，故项目架构需要 Typescript 支持，整个路由配置都是依赖 express 的路由模块，`nts-router` 除了简化控制器的注入流程，还可以便捷的支持一些请求参数的转换，比如快速获取 get 的请求参数，post 请求体的某一个值。除此之外，`nts-router` 还提供便捷的中间件定义及中间件管理。通过中间件，可完成请求鉴权，数据加解密等，非业务逻辑操作。支持控制器的前置中间件和后置中间件，可以配置包含排除项，包含项是会进入中间件的处理逻辑，排除项是绕过中间件的处理逻辑。包含项优先级高于排除项。可针对指定的路由配置。除此之外 `nts-router` 还提供针对于中间件处理前后的优先级关系，默认都是 10 ，当不定义优先级的时候，是根据你方法顺序依次解析的。当定义优先级的情况下数字越大的优先级处理越高，可实现定义好优先级，实现多个中间件有顺序的处理。为了方便更好的上手，我提供了 Demo 示例 [nts-router-demo](https://github.com/MaxTan330/nts-router-demo)

## nts-router 和 express 的路由

express 的路由代码

    app.route("/getAllCountry")
    	.get((req, res) => {
    		comservice.getCountries().then((result) => {
    			res.send({
    				status: 0,
    				data: result,
    				errmsg: ""
    			})
    		}, (error) => {
    			res.send({
    				status: 1,
    				data: "",
    				errmsg: error.errmsg
    			})
    		})
    	})

nts-router 的路由代码

    @Get('/getAllCountry')
    async getCountry() {
        return await this.cityServer.getAllCountry();
    }

代码优雅性和路由配置性，`nts-router` 都简洁很多

## nts-router 的基础使用

**控制器定义**

在控制器模块中添加一个 user.ts 文件。位于类的上方使用 @Controller 声明一个控制器，在类方法上声明路由控制器，当请求地址为 /user/v1/getUserList 的 get 请求则会进入 getUserList 方法，方法体需要将控制器处理的数据返回即可，不需要手动调用 send 处理，如果自己需要手动调用，可使用 `res.send()` 完成请求。

    import { UserService } from '../services/userService';
    import { Controller, Get } from '@maxtan/nts-router';
    @Controller('/user')
    export class UserController {
        private userServer: UserService;
        constructor() {
            this.userServer = new UserService();
        }
        @Get('/v1/getUserList')
        async getUserList() {
            return await this.userServer.getUserList();
        }
    }

类装饰器@Controller 默认参数 '/' 完整的请求地址 是@Controller + @Get 中的字符串，如@Controller('/user') + @Get('/v1/getUserList') 则完整的请求地址为 `/user/v1/getUserList` 。`nts-router` 支持快速注解的请求方法有如下四种
| 名称 | 描述 |
| ---------- | ----------- |
| @Get() | get 请求 |
| @Post() | post 请求  
| @Put() | put 请求 |
| @Delete() | delete 请求 |

**中间件定义**

同控制器声明一样,目前仅支持单文件的中间件

    import { Request, Response, NextFunction } from 'express';
    import { ResData, AuthBodyType } from '../utils/baseTypes';
    import { CacheService } from '../services/cacheService';
    import { setErrorMsg } from '../utils/common';
    import { Middleware, PreMiddleware, AfterMiddleware, Headers, Res, Req, Next } from '@maxtan/nts-router';
    import { ACCESS_TOKEN } from '../utils/constant';
    @Middleware()
    export class RouterMiddleware {
        private cacheService: CacheService;
        constructor() {
            this.cacheService = new CacheService();
        }
        @PreMiddleware()
        async authentication(req: Request, res: Response, next: NextFunction) {
            const token = req.header('access-token');
            if (token) {
                next();
            } else {
                res.status(403).send('鉴权失败')
            }
        }
        @PreMiddleware()
        async test(req: Request, res: Response, next: NextFunction) {
            req.query.text = '2';
            next();
        }
        @AfterMiddleware()
        async test2(data: any, req: Request, res: Response, next: NextFunction) {
            data.dex2 = '333';
            return data;
        }
        @AfterMiddleware()
        async test3(data: any, req: Request, res: Response, next: NextFunction) {
            data.dex = '222';
            return data;
        }
    }

**程序初始化**

上面通过装饰器定义的控制器和中间件，现在需要挂载到程序中。其实通过 `reflect-metadata` 直接拿到函数体，但是，会丢失 this，我们这个在处理的时候，传入实例化好的对象，然后就可以避免这个问题。

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

**程序入口**

    import { Server } from './app';
    const server = new Server();
    //初始化服务
    server.init();
    //启动服务
    server.app.listen(3000, () => {
        console.log(`server listening on port 3000 at time:${new Date()}`);
    });

**其他相关**

其他相关模块可以在 [nts-router-demo](https://github.com/MaxTan330/nts-router-demo) 中查看

## nts-router 的进阶使用

**控制器参数获取**

    import { Controller, Post, Body, Get, Query } from '@maxtan/nts-router';

    @Get('/v1/getUserList')
    async getUserList(@Query() query: any) {
        return await this.userServer.getUserList();
    }

通过 `@Query() query` 可以快速获取到 req.query 数据，可指定属性 如 `@Query('id') query` 则直接获取 req.query.id 数据。nts-router 支持的参数处理参数装饰器

| 名称       | 描述        | 备注                                                        |
| ---------- | ----------- | ----------------------------------------------------------- |
| @Query()   | req.query   | query 参数，可传入 key 获取 req.query[key]                  |
| @Body()    | req.body    | body 参数，可传入 key 获取 req.body[key]                    |
| @Params()  | req.params  | params 参数，可传入 key 获取 req.params[key]                |
| @Headers() | req.headers | headers 参数，可传入 key 获取 req.headers[key] 不区分大小写 |
| @Cookies() | req.cookies | cookies 参数，可传入 key 获取 req.cookies[key] 不区分大小写 |
| @Ip()      | ip          | 快速获取请求客户端 ip 地址                                  |
| @Res()     | res         | 原始的 Request                                              |
| @Req()     | req         | 原始的 Response                                             |
| @Next()    | next        | 原始的 NextFunction                                         |

上述的参数装饰器在前置中间件中也适用，但是不能再后置中间件中使用，因为后置中间件和前置中间件处理的数据模式不一样。

**前置中间件**

前置中间件 `PreMiddleware`，指的是在进入控制器之前的中间件。前置中间件会提供原始的 Request,Response,NextFunction 数据参数，可以对客户端的请求参数进行修改交给下一个前置路由或控制器处理
当需要在前置中间件如鉴权失败或要把结果返回给客户端的时候，可使用 `res.send()` 完成请求。在路由调用 send 方法之前最好先使用 `res.finished` 属性值进行判断，如果 `true` 则说明请求已经返回过结果啦，则不需要调用 send 方法

**后置中间件**

后置中间件 `AfterMiddleware`，指的是在控制器处理之后的中间件，后置中间件会提供控制器处理的结果 data 和原始的 Request,Response,NextFunction 数据参数，可以统一对控制器的处理结果进行统一处理，比如加密操作。当需要在后置中间件处理失败或要把结果返回给客户端的时候，可以像前置中间件那样使用 `res.send()` 完成请求。

大部分中间件非异常处理不需要手动调用 send 方法，在调用完后置中间件 `nts-router` 会调用 send 方法

**中间件的包含项和排除项**

前置的中间件和后置中间件可通过包含排除项来配置，决定控制器需不需要经过中间件处理，如果配置在排除项里面，则不需要中间件进行处理，如果配置在包含项，则配置包含项的地址请求列表才会进入中间件进行处理。一旦配置了包含排除项，则需要手动定义中间件的优先级。针对于优先级，可以决定中间件的先后处理顺序。名单需要提供完整的地址。

    @AfterMiddleware({
        priority: 12,
        include: ['/user/v1/getUserList'],
    })
    async test3(data: any, req: Request, res: Response, next: NextFunction) {
        data.dex = '222';
        return data;
    }

包含项配置 `test3` 中间件只对 `/user/v1/getUserList` 生效

    @PreMiddleware({
        priority: 15,
        exclude: ['/user/v1/getUserList'],
    })
    async test(req: Request, res: Response, next: NextFunction) {
        req.query.text = '2';
        next();
    }

排除项配置 `test` 中间件不对 `/user/v1/getUserList` 生效
