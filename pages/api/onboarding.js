import { getOnboardingStatus, setOnboardingDone } from '../../lib/mysql.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const yesValue = await getOnboardingStatus();
      return res.status(200).json({ yes: yesValue });
    } 
    
    else if (req.method === 'PUT') {
      // Vérifier que l'onboarding n'est pas déjà fait
      const yesValue = await getOnboardingStatus();
      if (yesValue !== 0) {
        return res.status(403).json({ error: 'Onboarding déjà effectué' });
      }

      const { siteName, adminEmail, username, password } = req.body;

      if (!siteName || !adminEmail || !username || !password) {
        return res.status(400).json({ error: 'Champs manquants' });
      }

      await setOnboardingDone({ siteName, adminEmail, username, password });

      return res.status(200).json({ message: 'Onboarding enregistré avec succès' });
    }

    else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Méthode ${req.method} non autorisée`);
    }
  } catch (error) {
    console.error('Erreur dans /api/onboarding:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}