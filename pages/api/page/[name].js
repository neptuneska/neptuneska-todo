// pages/api/pages/[name].js
import { GetChild, GetParent } from '../../../lib/mysql';
import { WithProtection } from '../../../lib/WithProtection.js';

async function handler(req, res) {
  try {

    const { query: { name }, method } = req;

    if (method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  const aprenList = await GetParent(name);
  if (!aprenList || aprenList.length === 0) {
    return res.status(404).json({ error: 'Parent non trouvé' });
  }

  const apren = aprenList[0]; // Prendre le premier élément
  const exists = await GetChild(apren.id);
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