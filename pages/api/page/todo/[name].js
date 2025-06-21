import dotenv from 'dotenv';
dotenv.config();

import { todo, addTodoTask, updateTodoTask } from '../../../../lib/mysql';
import { WithProtection } from '../../../../lib/WithProtection';

const isDebug = process.env.DEBUG === 'true';

function logDebug(...args) {
  if (isDebug) {
    console.log(...args);
  }
}

async function handler(req, res) {
  const {
    query: { name },
    method,
    headers,
    body,
  } = req;

  // Log complet de la requête reçue (méthode, headers, query, body)
  logDebug('Request received:', {
    method,
    headers,
    query: { name },
    body,
  });

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing "name" parameter' });
  }

  try {
    if (method === 'GET') {
      const todoData = await todo(name);
      if (!todoData) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      function formatTasks(rawTasks) {
        rawTasks.sort((a, b) => a.position - b.position);
        const tasks = rawTasks.map(t => ({
          id: t.todo_id.toString(),
          label: t.label,
          finished: !!t.finished,
        }));
        const order = tasks.map(t => t.id);
        const title = rawTasks.length > 0 ? rawTasks[0].page_name : '';
        return { title, tasks, order };
      }

      const formatted = formatTasks(todoData);
      logDebug('GET todo formatted:', formatted);
      return res.status(200).json(formatted);

    } else if (method === 'PUT') {
      const { label } = body;

      if (!label || typeof label !== 'string' || label.trim() === '') {
        return res.status(400).json({ error: 'Invalid or missing "label" in request body' });
      }

      logDebug('PUT addTodoTask:', { name, label: label.trim() });
      await addTodoTask(name, label.trim());
      const updatedTodo = await todo(name);
      logDebug('PUT updatedTodo:', updatedTodo);
      return res.status(200).json(updatedTodo);

    } else if (method === 'PATCH') {
        const taskId = headers['x-task-id'];

        if (!taskId || isNaN(Number(taskId))) {
          return res.status(400).json({ error: 'Missing or invalid "x-task-id" header' });
        }

        const { finished } = req.body;  // Petite correction : c'est req.body, pas body seul
        if (typeof finished !== 'boolean') {
          return res.status(400).json({ error: '"finished" must be a boolean' });
        }

        logDebug('PATCH updateTodoTask:', { name, taskId: Number(taskId), finished });

        // Ici on convertit booléen en int 0/1 avant l'appel
        await updateTodoTask(name, Number(taskId), finished ? 1 : 0);

        const updatedTodo = await todo(name);
        logDebug('PATCH updatedTodo:', updatedTodo);
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