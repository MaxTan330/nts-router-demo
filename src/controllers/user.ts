/**
 * @Author: MaxTan
 * @Description: 用户相关路由
 * @Date: 2019/11/06 15:23:54
 */
import { UserService } from '../services/userService';
import { User } from '../entries/user';
import { validate, Validator } from 'class-validator';
import { getValidatorError } from '../utils/baseUtils';
import { Controller, Post, Body, Get } from '@maxtan/nts-router';
import { setErrorMsg } from '../utils/common';
const validator = new Validator();
@Controller('/user')
export class UserController {
    private userServer: UserService;
    constructor() {
        this.userServer = new UserService();
    }
    /**
     * 用户注册
     */
    @Post('/v1/addUser')
    async addUser(@Body() body: any) {
        const user = new User();
        user.userName = body.userName;
        user.passWord = body.passWord;
        const errors = await validate(user, { groups: ['register'] });
        if (errors.length) {
            return setErrorMsg(getValidatorError(errors[0].constraints)[0]);
        } else {
            return await this.userServer.addUser(user);
        }
    }
    /**
     * 获取用户
     */
    @Get('/v1/getUserList')
    async getUserList() {
        return await this.userServer.getUserList();
    }
}
