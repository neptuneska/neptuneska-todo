import { GetParent, GetChild, SaveParent, SaveChild } from '../../lib/mysql.js';
import { WithProtection } from '../../lib/WithProtection.js';

async function handler(req, res) {
  try {

    if (req.method === 'GET') {
      const parents = await GetParent();

      const data = await Promise.all(parents.map(async (parent) => {
        const children = await GetChild(parent.id);

        return {
          label: parent.label,
          href: parent.href || '#',
          icon: parent.icon || null,
          defaultOpened: parent.defaultOpened === 1,
          children: children.map(child => ({
            label: child.label,
            href: child.href || '#',
          })),
        };
      }));

      return res.status(200).json(data);
    }

if (req.method === 'PUT') {
  const table = req.headers['x-table'];
  const body = req.body;

  if (!table || !['parent', 'child'].includes(table.toLowerCase())) {
    return res.status(400).json({ error: 'Header x-table invalide ou manquant' });
  }

  if (table.toLowerCase() === 'parent') {
    await SaveParent(body);
    return res.status(200).json({ message: 'Parent enregistré avec succès', data: body });
  }

  if (table.toLowerCase() === 'child') {
    if (!body.parentLabel) {
      return res.status(400).json({ error: 'parentLabel manquant dans la requête' });
    }


    const parents = await GetParent();
    const parent = parents.find(p => p.label === body.parentLabel);

    if (!parent) {
      return res.status(404).json({ error: `Parent avec label "${body.parentLabel}" non trouvé` });
    }

    const newBody = {
      ...body,
      parentId: parent.id,
    };
    delete newBody.parentLabel;

    await SaveChild(newBody);

    return res.status(200).json({ message: 'Child enregistré avec succès', data: newBody });
  }
}

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  } catch (error) {
    console.error('Erreur API fullstack:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export default WithProtection(handler);