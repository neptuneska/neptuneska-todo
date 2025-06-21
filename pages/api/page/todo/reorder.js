import { updateTaskPositionsBulk } from '../../../../lib/mysql';
import { WithProtection } from '../../../../lib/WithProtection'

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { name, positions } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing page name' });
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ error: 'Positions must be a non-empty array' });
    }

    for (const p of positions) {
      if (
        (typeof p.taskId !== 'string' && typeof p.taskId !== 'number') ||
        typeof p.position !== 'number' || p.position < 0
      ) {
        return res.status(400).json({ error: 'Invalid taskId or position in positions array' });
      }
    }

    await updateTaskPositionsBulk(name, positions);

    return res.status(200).json({ message: 'Positions updated' });
  } catch (err) {
    console.error('Error updating positions:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default WithProtection(handler);