// /pages/api/verify-token.js

import redis from '../../lib/redis';
import { verifyToken } from '../../lib/jwt';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;

  if (!token) {
    return res.status(400).json({ message: 'Token manquant' });
  }


  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }


  const userData = await redis.get(token);

  if (!userData) {
    return res.status(404).json({ message: 'Utilisateur non trouvé dans Redis' });
  }


  const user = JSON.parse(userData);


  if (user.userId !== decodedToken.userId) {
    return res.status(401).json({ message: 'Token et utilisateur ne correspondent pas' });
  }


  return res.status(200).json({
    userId: user.userId,
  });
}