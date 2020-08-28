/**
 * @Author: MaxTan
 * @Description: 用户数据访问层
 * @Date: 2019/11/12 15:39:27
 */
import { getConnection, Connection } from 'typeorm';
import { User } from '../entries/user';
export class UserDao {
    private connection: Connection;
    constructor() {
        this.connection = getConnection();
    }
    /**
     * 用户注册
     * @param data
     */
    public async saveUser(data: User): Promise<User> {
        const repository = this.connection.getRepository(User);
        data.updateBy = data.userId;
        data.updateDate = new Date();
        const user = repository.create(data);
        return await repository.save(user);
    }
    /**
     * 用户注册
     * @param data
     */
    public async getUserList(): Promise<User[]> {
        const repository = this.connection.getRepository(User);
        return await repository.find();
    }
}
