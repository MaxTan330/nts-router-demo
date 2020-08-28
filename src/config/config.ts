/**
 * @Author: MaxTan
 * @Description: 项目全局配置
 * @Date: 2019/09/05 14:41:43
 */
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import path from 'path';
import { configure, getLogger } from 'log4js';
const isProd = process.env.NODE_ENV === 'production';
const logger = getLogger();
export class MysqlOrm implements MysqlConnectionOptions {
    public type: 'mysql' = 'mysql';
    public host: string = isProd ? 'localhost' : '10.2.4.175';
    public port = 3506;
    public username = 'root';
    public password = 'dqT%#60h';
    public database: string = isProd ? 'nts_site' : 'nts_site_test';
    public entities: Array<string> = [path.resolve(__dirname, '../entries/*.js')];
    public synchronize = true;
    public logging = false;
}
export class RedisOptions {
    public host: string = isProd ? 'localhost' : '10.2.4.175';
    public port = 6379;
    public password = 'dqT%#60h';
}

export class Config {
    public mysqlOrm: MysqlOrm;
    public redisOptions: RedisOptions;
    constructor() {
        this.mysqlOrm = new MysqlOrm();
        this.redisOptions = new RedisOptions();
        this.configLog();
        //防止redis连接失败导致node进程崩溃
        process.on('uncaughtException', (err) => {
            if (err) {
                logger.error(err);
            } else {
                process.exit(1);
            }
        });
    }
    /**
     * 配置日志参数
     */
    private configLog(): void {
        configure({
            appenders: {
                systemlog: {
                    type: 'dateFile',
                    filename: './logs/systemlog',
                    pattern: 'yyyy-MM-dd.log',
                    alwaysIncludePattern: true,
                },
            },
            categories: {
                default: {
                    appenders: ['systemlog'],
                    level: 'info',
                },
            },
        });
    }
}
