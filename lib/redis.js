import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Instance Redis client connectée via l'URL REDIS_URL dans les variables d'environnement.
 * @type {import('ioredis').Redis}
 */
const redis = new Redis(process.env.REDIS_URL);

export default redis;
export { redis };