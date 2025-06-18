// pages/api/pages/[name].js
import { ChildExist } from '../../../lib/mysql';
import { WithProtection } from '../../../lib/WithProtection.js';

async function handler(req, res) {
  try {

    const { query: { name }, method } = req;

    if (method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const exists = await ChildExist(name);
    if (!exists) {
      return res.status(404).json({ error: 'Page non trouvée' });
    }
    return res.status(200).json({ message: 'Page trouvée', name });
  } catch (error) {
    console.error('API /pages/[name] error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export default WithProtection(handler);