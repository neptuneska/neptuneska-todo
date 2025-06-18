import { todo, addTodoTask, updateTodoTask } from '../../../../lib/mysql';
import { WithProtection } from '../../../../lib/WithProtection'

async function handler(req, res) {
  const {
    query: { name },
    method,
    headers,
  } = req;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "name" parameter' });
  }

  try {
    if (method === 'GET') {
      const todoData = await todo(name);

      if (!todoData) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      return res.status(200).json(todoData);

    } else if (method === 'PUT') {
      const { label } = req.body;

      if (!label || typeof label !== 'string' || label.trim() === '') {
        return res.status(400).json({ error: 'Invalid or missing "label" in request body' });
      }

      await addTodoTask(name, label.trim());
      const updatedTodo = await todo(name);
      return res.status(200).json(updatedTodo);

    } else if (method === 'PATCH') {
      const taskId = headers['x-task-id'];
      const action = headers['x-reorder-change'];

      if (!taskId || isNaN(Number(taskId))) {
        return res.status(400).json({ error: 'Missing or invalid "x-task-id" header' });
      }

      const { finished } = req.body;
      if (typeof finished !== 'boolean') {
        return res.status(400).json({ error: '"finished" must be a boolean' });
      }

      await updateTodoTask(name, Number(taskId), finished);
      const updatedTodo = await todo(name);
      return res.status(200).json(updatedTodo);

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('API /page/todo/[name] error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default WithProtection(handler);