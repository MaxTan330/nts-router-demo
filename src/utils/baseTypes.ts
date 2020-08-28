/**
 *  @des 辅助类型
 *  @author MaxTan
 *  @date 2020/08/28
 */
export interface Page {
    pageSize?: number; //一页数量
    pageNumber?: number; //当前页数
    total?: number; //数据总数
    pageTotal?: number; //总页数
    pageData?: Array<object>; //当前页数据
}

export interface ResData {
    status?: 0 | 1; //状态 0 成功 1 失败
    data?: object | Array<object> | Page | string; //数据
    message?: string; //消息
}
