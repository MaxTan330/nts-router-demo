/**
 * @Author: MaxTan
 * @Description: 缓存服务
 * @Date: 2019/11/02 13:39:33
 */
import redis, { RedisClient } from 'redis';
import { Config } from '../config/config';
import { getLogger } from 'log4js';
const logger = getLogger();
export class CacheService {
    private redisClient: RedisClient;
    constructor() {
        const redisOptions = new Config().redisOptions;
        this.redisClient = redis.createClient(redisOptions);
        this.redisClient.on('error', function (err: any) {
            logger.error(err);
        });
    }
    /**
     * 设置redis值，通过EX 模式 设置键的过期时间为 ttl 秒
     * @param key redis键
     * @param value redis值
     * @param ttl 有效时间
     */
    public async setByEX(key: string, value: string, ttl: number): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.set(key, value, 'EX', ttl, (error: any, reply: any) => {
                if (error) {
                    logger.error(error);
                    throw new Error('setByEX 失败');
                }
                resolve(reply);
            });
        });
    }
    /**
     * 设置redis值，通过NX 模式 只在键不存在时，才对键进行设置操作。
     * @param key redis键
     * @param value redis值
     * @param ttl 有效时间
     */
    public async setByNX(key: string, value: string): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.set(key, value, 'NX', (error: any, reply: any) => {
                if (error) {
                    logger.error(error);
                    throw new Error('setByNX 失败');
                }
                resolve(reply);
            });
        });
    }
    /**
     * 设置redis值，通过xx 模式 只有键已经存在时，才对键进行设置操作
     * @param key redis键
     * @param value redis值
     * @param ttl 有效时间
     */
    public async setByXX(key: string, value: string, ttl: number): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.set(key, value, 'XX', ttl, (error: any, reply: any) => {
                if (error) {
                    logger.error(error);
                    throw new Error('setByXX 失败');
                }
                resolve(reply);
            });
        });
    }
    /**
     * 获取redis值
     * @param key redis键
     */
    public async get(key: string): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.get(key, (error: any, reply: any) => {
                if (error) {
                    logger.error(error);
                    throw new Error('get 失败');
                }
                let result = '';
                try {
                    result = JSON.parse(reply);
                } catch (error) {
                    result = reply;
                }
                resolve(result);
            });
        });
    }
    /**
     * 获取redis键的ttl值
     * @param key redis键
     */
    public async getTtl(key: string): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.ttl(key, (error: any, reply: number) => {
                if (error) {
                    logger.error(error);
                    throw new Error('getTtl 失败');
                }
                resolve(reply);
            });
        });
    }
    /**
     * 更新redis值有效时间
     * @param key redis键
     */
    public async resetTtl(key: string, ttl: number): Promise<any> {
        return new Promise((resolve) => {
            this.redisClient.expire(key, ttl, (error: any, reply: any) => {
                if (error) {
                    logger.error(error);
                    throw new Error('resetTtl 失败');
                }
                resolve(reply);
            });
        });
    }
}
