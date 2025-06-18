import redis from '../../lib/redis';
import { authenticateUser } from '../../lib/mysql.js';
import { signToken } from '../../lib/jwt';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    const tokenPayload = {
      userId: user.id,
    };
    const token = signToken(tokenPayload);

    await redis.set(token, JSON.stringify(tokenPayload));

  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  }));

    res.status(200).json({ message: 'Connexion réussie' });

  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
}