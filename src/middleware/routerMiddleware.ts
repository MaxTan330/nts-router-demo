/**
 * @Author: MaxTan
 * @Description: 前置路由中间件
 * @Date: 2020/04/16 10:18:15
 */
import { Request, Response, NextFunction } from 'express';
import { ResData } from '../utils/baseTypes';
import { setErrorMsg } from '../utils/common';
import { Middleware, PreMiddleware, AfterMiddleware, Headers, Res, Req, Next } from '@maxtan/nts-router';
@Middleware()
export class RouterMiddleware {
    constructor() {}
    @PreMiddleware({
        priority: 3,
        exclude: ['/user/v1/getUserList'],
    })
    async authentication(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction,
        @Headers() token: string
    ) {
        let resData: ResData = {};
        if (token) {
            next();
        } else {
            resData = setErrorMsg('access-token缺失');
            res.status(403).send(resData);
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
