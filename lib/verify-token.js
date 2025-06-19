import { redis } from './redis';
import { verifyToken } from './jwt';

/**
 * Vérifie un token JWT, valide sa présence dans Redis, et retourne les infos utilisateur.
 * @param {string} token Token JWT à vérifier
 * @returns {object|null} userData si valide, sinon null
 */
export async function verifyUserToken(token) {
  if (!token) return null;

  const decodedToken = verifyToken(token);
  if (!decodedToken) return null;

  const redisKey = `${token}`;

  try {
    const data = await redis.get(redisKey);
    if (!data) return null;

    let userData;
    try {
      userData = JSON.parse(data);
    } catch {
      return null;
    }

    if (userData.userId !== decodedToken.userId) return null;

    return {
      userId: userData.userId,
    };
  } catch (err) {
    console.error('Erreur Redis dans verifyUserToken:', err);
    return null;
  }
}