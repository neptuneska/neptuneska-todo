import cookie from 'cookie';
import { verifyUserToken } from './verify-token.js';

export function WithProtection(handler) {
  return async (req, res) => {
    try {
      // Parse les cookies depuis l'en-tête HTTP
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = cookies.token; // adapte ce nom à ton vrai cookie

      if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
      }

      const userData = await verifyUserToken(token);

      if (!userData || !userData.userId) {
        return res.status(401).json({ error: 'Token invalide' });
      }

      req.user = userData;

      return handler(req, res);
    } catch (err) {
      console.error('Erreur dans WithProtection:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}