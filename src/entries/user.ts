/**
 * @Author: MaxTan
 * @Description: user 实体类
 * @Date: 2019/11/01 19:05:34
 */
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
@Entity('nts_user')
export class User {
    @Index({
        unique: true,
    })
    @PrimaryColumn({
        comment: '用户id',
        name: 'user_id',
    })
    userId!: string;

    @Column({
        comment: '用户名',
        default: null,
        name: 'user_name',
    })
    @IsNotEmpty({ message: '用户名为空', groups: ['register'] })
    userName!: string;

    @Column({
        comment: '用户密码',
        default: null,
        name: 'password',
    })
    @IsNotEmpty({ message: '用户密码为空', groups: ['register'] })
    passWord!: string;
    @Column({
        comment: '创建日期',
        default: null,
        name: 'create_date',
    })
    createDate!: Date;

    @Column({
        comment: '创建者',
        default: null,
        name: 'create_by',
    })
    createBy!: string;

    @Column({
        comment: '修改日期',
        default: null,
        name: 'update_date',
    })
    updateDate!: Date;

    @Column({
        comment: '更新者',
        default: null,
        name: 'update_by',
    })
    updateBy!: string;
}
