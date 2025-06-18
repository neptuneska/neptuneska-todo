import jwt from 'jsonwebtoken';

/**
 * Génère un token JWT signé avec un payload donné.
 * @param {Object} payload - Les données à encoder dans le token.
 * @returns {string} Le token JWT signé.
 * @throws {Error} Si la clé secrète n'est pas définie.
 */
export function signToken(payload) {
  if (!process.env.SECRET_TOKEN) {
    throw new Error('La clé secrète SECRET_TOKEN n\'est pas définie dans les variables d\'environnement.');
  }

  return jwt.sign(payload, process.env.SECRET_TOKEN, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

/**
 * Vérifie un token JWT et retourne son payload décodé.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {Object|null} Le payload décodé si valide, sinon null.
 */
export function verifyToken(token) {
  if (!process.env.SECRET_TOKEN) {
    console.error('La clé secrète SECRET_TOKEN n\'est pas définie dans les variables d\'environnement.');
    return null;
  }

  try {
    return jwt.verify(token, process.env.SECRET_TOKEN, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    // Token invalide, expiré ou falsifié
    return null;
  }
}