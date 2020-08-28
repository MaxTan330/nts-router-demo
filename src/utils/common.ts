import { ResData } from '../utils/baseTypes';
/**
 * 设置错误消息
 * @param message 错误消息
 */
export function setErrorMsg(message: string): ResData {
    const resData: ResData = {};
    resData.status = 1;
    resData.message = message;
    return resData;
}
/**
 * 设置成功消息
 * @param message 成功消息
 */
export function setSuccessMsg(message: string): ResData {
    const resData: ResData = {};
    resData.status = 0;
    resData.message = message;
    return resData;
}
