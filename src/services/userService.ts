/**
 * @Author: MaxTan
 * @Description: 用户服务类
 * @Date: 2020/08/28 15:40:42
 */
import { User } from '../entries/user';
import { G16 } from '../utils/baseUtils';
import { UserDao } from '../dao/userDao';
import { MSG_CODE } from '../utils/constant';
import { getLogger } from 'log4js';
import { ResData } from '../utils/baseTypes';
import { Validator } from 'class-validator';
import { setErrorMsg } from '../utils/common';
const validator = new Validator();
const logger = getLogger();
export class UserService {
    private userDao: UserDao;
    constructor() {
        this.userDao = new UserDao();
    }
    /**
     * 添加用户信息
     * @param userOne
     */
    public async addUser(userOne: User) {
        let resData: ResData = {};
        try {
            userOne.userId = G16();
            userOne.createBy = userOne.userId;
            userOne.createDate = new Date();
            const addUser = await this.userDao.saveUser(userOne);
            resData.status = 0;
            resData.data = addUser;
            return Promise.resolve(resData);
        } catch (error) {
            logger.error(error);
            resData = setErrorMsg(MSG_CODE.msg_004);
            return Promise.resolve(resData);
        }
    }
    /**
     * 获取所有用户
     * @param userOne
     */
    public async getUserList() {
        let resData: ResData = {};
        try {
            const userList = await this.userDao.getUserList();
            resData.status = 0;
            resData.data = userList;
            return Promise.resolve(resData);
        } catch (error) {
            logger.error(error);
            resData = setErrorMsg(MSG_CODE.msg_004);
            return Promise.resolve(resData);
        }
    }
}
