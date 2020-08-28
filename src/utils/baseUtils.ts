/**
 * @Author: MaxTan
 * @Description: 基础的工具类
 * @Date: 2020/08/27 15:07:15
 */
export function N4() {
    return Math.random().toString().slice(-4);
}
/**
 * 随机6位随机数字
 */
export function N6() {
    return Math.random().toString().slice(-6);
}
/**
 * 随机4位Guid
 */
export function G4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
/**
 * 随机8位Guid
 */
export function G8() {
    return `${G4()}${G4()}`;
}
/**
 * 随机16位Guid
 */
export function G16() {
    return `${G8()}${G8()}`;
}
/**
 * 随机32位Guid
 */
export function randomGuid() {
    return `${G8()}-${G4()}-${G4()}-${G4()}-${G4()}${G8()}`;
}
/**
 * 获取Validator错误信息
 */
export function getValidatorError(obj: any) {
    const result = [];
    for (const i in obj) {
        result.push(obj[i]);
    }
    return result;
}
/**
 * 日期格式化字符串
 * @param date 日期对象
 * @param formatStr 格式文本串
 */
export function dateFormat(date: Date, formatStr: string) {
    const o: any = {
        'M+': date.getMonth() + 1, // 月
        'd+': date.getDate(), // 日
        'h+': date.getHours(), // 时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季节
        S: date.getMilliseconds(), //毫秒数
    };
    if (/(y+)/.test(formatStr)) {
        formatStr = formatStr.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
        if (new RegExp('(' + k + ')').test(formatStr)) {
            formatStr = formatStr.replace(
                RegExp.$1,
                RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
            );
        }
    }
    return formatStr;
}
