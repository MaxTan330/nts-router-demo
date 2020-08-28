/**
 * @Author: MaxTan
 * @Description: 基于express封装的装饰器路由
 * @Date: 2020/08/28 10:31:54
 */
type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
type Param = 'req' | 'res' | 'next' | 'params' | 'query' | 'body' | 'headers' | 'cookies' | 'ip';
type WareType = 0 | 1; // 0 前置路由 1 后置路由
export type Parse = 'number' | 'string' | 'boolean';
export type MiddlewareType = {
    type?: WareType; //0
    name?: string; //中间件名称
    priority: number; //中间件优先级别
    blackList?: Array<string>; //白名单
    whiteList?: Array<string>; //黑名单
};
export type MiddlewareList = {
    preMiddlewareList: Array<MiddlewareType>; //前置路由中间件列表
    afterMiddlewareList: Array<MiddlewareType>; //后置路由中间件列表
};
export interface RouteType {
    target: object;
    name: string;
    type: HttpMethod;
    path: string;
    func: (...args: any[]) => any;
    loaded?: boolean;
    preMiddleware?: Array<string>;
    endMiddleware?: Array<string>;
}

export type ParamType = {
    key: string;
    index: number;
    type: Param;
    name: string;
};

export type ParseType = {
    type: Parse;
    index: number;
    name: string;
};
import { Router, Request, Response, NextFunction, Application } from 'express';
import 'reflect-metadata';
const CONTROLLER_METADATA = 'controller';
const MIDDLEWARE_METADATA = 'middleware';
const MIDDLEMETHOD_METADATA = 'middleware_method';
const ROUTE_METADATA = 'method';
const PARAM_METADATA = 'param';
const PARSE_METADATA = 'parse';
/**
 * 额外的参数处理器
 * @param req
 * @param res
 * @param next
 * @param paramArr
 * @param parseArr
 */
function extractParameters(
    req: Request,
    res: Response,
    next: NextFunction,
    paramArr: ParamType[] = [],
    parseArr: ParseType[] = []
) {
    if (!paramArr.length) return [req, res, next];
    const args: any[] = [];
    // 进行第三层遍历
    paramArr.forEach((param) => {
        const { key, index, type } = param;
        // 获取相应的值，如 @Query('id') 则为 req.query.id
        switch (type) {
            case 'req':
                args[index] = req;
                break;
            case 'res':
                args[index] = res;
                break;
            case 'next':
                args[index] = next;
                break;
            case 'query':
                args[index] = key ? req.query[key] : req.query;
                break;
            case 'body':
                args[index] = key ? req.body[key] : req.body;
                break;
            case 'params':
                args[index] = key ? req.params[key] : req.params;
                break;
            case 'headers':
                args[index] = key ? req.headers[key.toLowerCase()] : req.headers;
                break;
            case 'cookies':
                args[index] = key ? req.cookies[key.toLowerCase()] : req.cookies;
                break;
            case 'ip':
                const realIP = req.get('X-Real-IP') || req.get('x-forwarded-For') || req.ip;
                const reqIp = realIP.match(/\d+\.\d+\.\d+\.\d+/);
                const ip = reqIp && reqIp[0];
                args[index] = ip;
                break;
        }
    });
    // 小优化，处理参数类型
    parseArr.forEach((parse) => {
        const { type, index } = parse;
        switch (type) {
            case 'number':
                args[index] = +args[index];
                break;
            case 'string':
                args[index] = args[index] + '';
                break;
            case 'boolean':
                args[index] = Boolean(args[index]);
                break;
        }
    });
    args.push(req, res, next);
    return args;
}
/**
 * 前置路由处理函数工厂
 * @param instance 实例对象
 * @param fnName 函数名
 */
function preMiddleWareFactory(instance: any, fnName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 处理回调参数
            const paramList = Reflect.getMetadata(PARAM_METADATA, instance, fnName);
            const parseList = Reflect.getMetadata(PARSE_METADATA, instance, fnName);
            const args = extractParameters(req, res, next, paramList, parseList);
            if (instance && instance[fnName]) {
                instance[fnName](...args);
            }
        } catch (error) {
            next(error);
        }
    };
}
/**
 * 后置路由处理函数工厂
 * @param instance 实例对象
 * @param fnName 函数名
 */
function afterMiddleWareFactory(instance: any, fnName: string) {
    // 处理回调参数
    return async (result: any, req: Request, res: Response, next: NextFunction) => {
        try {
            const args = [result, req, res, next];
            if (instance && instance[fnName]) {
                const data = await instance[fnName](...args);
                return data;
            }
            return result;
        } catch (error) {
            console.error(error);
            return result;
        }
    };
}
/**路由控制处理工厂 */
function handlerRouterFactory(
    instance: any,
    routeName: string,
    paramList: ParamType[],
    parseList: ParseType[],
    nextFn?: Array<Function>
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 获取路由函数的参数
            const args = extractParameters(req, res, next, paramList, parseList);
            const result = await instance[routeName](...args);
            if (nextFn && nextFn.length) {
                let fnLen = nextFn.length;
                let lastResult: any;
                const nextItem = async function (data: any) {
                    if (fnLen < 1) {
                        return lastResult;
                    } else {
                        const mArgs = [data, req, res, next];
                        lastResult = await nextFn[fnLen - 1](...mArgs);
                        fnLen--;
                        nextItem(lastResult);
                    }
                };
                await nextItem(result);
                // 如果回应已发送则不调用send 方法
                !res.finished && res.send(lastResult);
            } else {
                !res.finished && res.send(result);
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    };
}
/**
 * 控制器
 * @param path
 */
export function Controller(path = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
    };
}
/**
 * 中间件
 * @param path
 */
export function Middleware(path = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(MIDDLEWARE_METADATA, path, target);
    };
}
/**
 * 创建中间件，前置中间件0 后置中间件1
 * @param path
 */
function crateMiddleware(type: WareType) {
    return (middlewareType: MiddlewareType = { priority: 10 }): MethodDecorator => (
        target: object,
        name: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        const metaData = {
            name: name,
            type,
            ...middlewareType,
        };
        Reflect.defineMetadata(MIDDLEMETHOD_METADATA, metaData, descriptor.value);
    };
}
/**
 * 创建http方法装饰器
 * @param path
 */
function createMethodDecorator(method: HttpMethod = 'get') {
    return (path = '/'): MethodDecorator => (target: object, name: string | symbol, descriptor: PropertyDescriptor) => {
        const metaData: any = {
            type: method,
            path,
        };
        Reflect.defineMetadata(ROUTE_METADATA, metaData, descriptor.value);
    };
}

/**
 * 创建方法参数装饰器
 * @param path
 */
function createParamDecorator(type: Param) {
    return (key?: string): ParameterDecorator => (target: object, name: string | symbol, index: number) => {
        // 这里要注意这里 defineMetadata 挂在 target.name 上
        // 但该函数的参数有顺序之分，下一个装饰器定义参数后覆盖之前的，所以要用 preMetadata 保存起来
        const preMetadata = Reflect.getMetadata(PARAM_METADATA, target, name) || [];
        const newMetadata = [{ key, index, type }, ...preMetadata];
        Reflect.defineMetadata(PARAM_METADATA, newMetadata, target, name);
    };
}
/**
 * 格式化
 * @param type
 */
export function Parse(type: Parse): ParameterDecorator {
    return (target: object, name: string | symbol, index: number) => {
        const preMetadata = Reflect.getMetadata(PARAM_METADATA, target, name) || [];
        const newMetadata = [{ type, index }, ...preMetadata];
        Reflect.defineMetadata(PARSE_METADATA, newMetadata, target, name);
    };
}
export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Query = createParamDecorator('query');
export const Body = createParamDecorator('body');
export const Params = createParamDecorator('params');
export const Headers = createParamDecorator('headers');
export const Cookies = createParamDecorator('cookies');
export const Ip = createParamDecorator('ip');
export const Res = createParamDecorator('res');
export const Req = createParamDecorator('req');
export const Next = createParamDecorator('next');
export const PreMiddleware = crateMiddleware(0);
export const AfterMiddleware = crateMiddleware(1);
/**
 * 设置路由跨域和options请求响应
 * @param app express Application
 */
export function allowOrigin(app: Application) {
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild'
        );
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        if (req.method == 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });
}
/**
 * 根据store 获取 Metadata
 * @param store
 */
function getMetadataByInstance(store: object): { proto: any; fnNameArr: Array<string> } {
    const proto = Object.getPrototypeOf(store);
    // 拿到该实例的原型方法
    const fnNameArr = Object.getOwnPropertyNames(proto).filter(
        (n) => n !== 'constructor' && typeof proto[n] === 'function'
    );
    return {
        proto,
        fnNameArr,
    };
}
/**
 * 获取中间件列表
 * @param list
 */
function getMiddleWareList(middleList: Array<MiddlewareType>): MiddlewareList {
    // 获取前置路由和后置路由
    const preMiddlewareList = middleList.filter((item) => item.type == 0);
    const afterMiddlewareList = middleList.filter((item) => item.type == 1);
    preMiddlewareList.sort((a, b) => {
        return b.priority - a.priority;
    });
    afterMiddlewareList.sort((a, b) => {
        return b.priority - a.priority;
    });
    return { preMiddlewareList, afterMiddlewareList };
}
/**
 * 过滤中间件黑白名单
 * @param list
 */
function getMiddleWareByFilterList(middleList: MiddlewareList, regStr: string): MiddlewareList {
    // 获取前置路由和后置路由
    let preMiddlewareList = middleList.preMiddlewareList;
    let afterMiddlewareList = middleList.afterMiddlewareList;
    preMiddlewareList = preMiddlewareList.filter((item) => {
        if (item.blackList) {
            return item.blackList.indexOf(regStr) != -1;
        } else if (item.whiteList) {
            return item.whiteList.indexOf(regStr) == -1;
        } else {
            return true;
        }
    });
    afterMiddlewareList = afterMiddlewareList.filter((item) => {
        if (item.blackList) {
            return item.blackList.indexOf(regStr) != -1;
        } else if (item.whiteList) {
            return item.whiteList.indexOf(regStr) == -1;
        } else {
            return true;
        }
    });
    return { preMiddlewareList, afterMiddlewareList };
}
/**
 * 路由注册
 * @param app express Application
 * @param routerStore 控制器层实例
 * @param routerMiddleware 路由中间件
 */
export function registerRouter(app: Application, routerStore: object, routerMiddleware?: object) {
    const router = Router();
    let mList: MiddlewareList;
    let mProto: any;
    if (routerMiddleware) {
        // 获取路由中间件的函数名和原型
        const { proto, fnNameArr } = getMetadataByInstance(routerMiddleware);
        const middleList: Array<MiddlewareType> = [];
        fnNameArr.forEach((item: string) => {
            const routeMetadata: MiddlewareType = Reflect.getMetadata(MIDDLEMETHOD_METADATA, proto[item]);
            middleList.push(routeMetadata);
        });
        mProto = proto;
        mList = getMiddleWareList(middleList);
    }
    Object.values(routerStore).forEach((instance) => {
        const controllerMetadata: string = Reflect.getMetadata(CONTROLLER_METADATA, instance.constructor);
        const { proto, fnNameArr } = getMetadataByInstance(instance);
        fnNameArr.forEach((routeName) => {
            const routeMetadata: RouteType = Reflect.getMetadata(ROUTE_METADATA, proto[routeName]);
            //判断是否是路由方法
            if (routeMetadata) {
                const { type, path } = routeMetadata;
                const fullPath = controllerMetadata + path;
                const wareList = getMiddleWareByFilterList(mList, fullPath);
                const preFn: any = [];
                const endFn: any = [];
                //是否存在路由中间件
                if (mProto) {
                    //处理前置中间件
                    if (wareList.preMiddlewareList) {
                        wareList.preMiddlewareList.forEach((preMiddleware) => {
                            if (preMiddleware.name) {
                                preFn.push(preMiddleWareFactory(routerMiddleware, preMiddleware.name));
                            }
                        });
                    }
                    //处理后置中间件
                    if (wareList.afterMiddlewareList) {
                        wareList.afterMiddlewareList.forEach((endMiddleware) => {
                            if (endMiddleware.name) {
                                endFn.push(afterMiddleWareFactory(routerMiddleware, endMiddleware.name));
                            }
                        });
                    }
                }
                //注册控制器函数
                const handler = handlerRouterFactory(
                    instance,
                    routeName,
                    Reflect.getMetadata(PARAM_METADATA, instance, routeName),
                    Reflect.getMetadata(PARSE_METADATA, instance, routeName),
                    endFn
                );
                //注册路由
                router[type](fullPath, ...preFn, handler);
            }
        });
    });
    app.use('/', router);
}