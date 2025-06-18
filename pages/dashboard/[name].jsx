import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { TextInput, Checkbox } from '@mantine/core';
import { GripVertical } from 'lucide-react';
import { showNotification } from '@mantine/notifications';
import styles from '../../styles/Name.module.scss';
import Sidebar from '../../components/Sidebar';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/router';

function ErrorRedirect({ errorCode }) {
  const router = useRouter();

  useEffect(() => {
    if (errorCode === 401) {
      router.push('/login');
    } else if (errorCode === 404) {
      router.push('/404');
    }
  }, [errorCode, router]);

  return null;
}

function SortableItem({ task, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    listStyle: 'none',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <GripVertical
        size={20}
        style={{
          cursor: 'grab',
          userSelect: 'none',
          color: '#888',
          flexShrink: 0,
        }}
        {...listeners}
        title="Glisser pour déplacer"
      />
      <Checkbox
        checked={task.finished}
        label={task.label}
        onChange={() => onToggle(task.id)}
        sx={{
          textDecoration: task.finished ? 'line-through' : 'none',
          color: task.finished ? '#888' : 'inherit',
          flex: 1,
        }}
      />
    </li>
  );
}

export default function DashboardPage({ userId, pageData, todoData, errorCode }) {
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [tasks, setTasks] = useState(todoData?.tasks || []);
  const [order, setOrder] = useState(todoData?.order || []);
  const [todoTitle, setTodoTitle] = useState(todoData?.title || '');

  const sensors = useSensors(useSensor(PointerSensor));

  if (errorCode === 401) return <ErrorRedirect errorCode={errorCode} />;
  if (errorCode === 404) return <ErrorRedirect errorCode={errorCode} />;

  const [contextMenu, setContextMenu] = useState(null);
  const handleCloseContextMenu = () => setContextMenu(null);
  
  useEffect(() => {
    if (!tasks.length) {
      showNotification({
        title: 'Info',
        message: 'Aucune liste de tâches disponible.',
        color: 'blue',
      });
    }
  }, [tasks]);
  
  const handleAddTask = async () => {
    if (!newTaskLabel.trim()) return;

    try {
      const res = await axios.put(`/api/page/todo/${encodeURIComponent(pageData.name)}`, {
        label: newTaskLabel,
      });
      const updatedTodo = res.data;

      setTasks(updatedTodo.tasks);
      setOrder(updatedTodo.order);
      setTodoTitle(updatedTodo.title);
      setNewTaskLabel('');

      showNotification({
        title: 'Tâche ajoutée',
        message: `La tâche "${newTaskLabel}" a été ajoutée avec succès.`,
        color: 'green',
      });
    } catch (err) {
      console.error('Erreur ajout tâche:', err);
      showNotification({
        title: 'Erreur',
        message: 'Erreur lors de l’ajout de la tâche',
        color: 'red',
      });
    }
  };

  const handleToggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const res = await axios.patch(`/api/page/todo/${encodeURIComponent(pageData.name)}`, {
        finished: !task.finished,
      }, {
        headers: { 'x-task-id': task.id },
      });
      const updatedTodo = res.data;

      setTasks(updatedTodo.tasks);
      setOrder(updatedTodo.order);
      setTodoTitle(updatedTodo.title);

      showNotification({
        title: 'Tâche mise à jour',
        message: `La tâche "${task.label}" a été ${task.finished ? 'reprise' : 'terminée'}.`,
        color: 'blue',
      });
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
      showNotification({
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de la tâche',
        color: 'red',
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);

    const newOrder = arrayMove(order, oldIndex, newIndex);

    const newTasks = newOrder
      .map((taskId) => tasks.find(t => t.id === taskId))
      .filter(Boolean);

    setOrder(newOrder);
    setTasks(newTasks);

    const positions = newOrder.map((taskId, index) => ({
      taskId,
      position: index + 1,
    }));

    try {
      await axios.post('/api/page/todo/reorder', {
        name: pageData.name,
        positions,
      });

      showNotification({
        title: 'Ordre sauvegardé',
        message: 'L’ordre des tâches a été mis à jour.',
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur sauvegarde ordre:', error);
      showNotification({
        title: 'Erreur',
        message: 'Erreur lors de la sauvegarde de l’ordre',
        color: 'red',
      });
    }
  };


  const sortedTasks = order.map(id => tasks.find(t => t.id === id)).filter(Boolean);

  return (
    <div className={styles.global} onClick={handleCloseContextMenu}>
      <Sidebar />
      <div className={styles.container}>
        <h1>{pageData.title || 'Page'}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Plus
            size={20}
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
            onClick={handleAddTask}
            title="Ajouter tâche"
          />
          <TextInput
            placeholder="Ajouter une tâche..."
            variant="unstyled"
            style={{ backgroundColor: 'transparent', color: 'inherit', width: 300 }}
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
          />
        </div>

        {sortedTasks.length > 0 ? (
          <>
            <h2>{todoTitle}</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={order}
                strategy={verticalListSortingStrategy}
              >
                <ul style={{ padding: 0 }}>
                  {sortedTasks.map(task => (
                    <SortableItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onContextMenu={(e) => handleTaskContextMenu(e, task.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          null
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { req, params } = context;
  const { name } = params;
  const cookieHeader = req.headers.cookie || '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  try {

    const verifyRes = await axios.get(`${baseUrl}/api/verify-token`, {
      headers: { cookie: cookieHeader },
    });

    if (verifyRes.status !== 200) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const userId = verifyRes.data.userId;

    const pageRes = await axios.get(`${baseUrl}/api/page/${encodeURIComponent(name)}`, {
      headers: { cookie: cookieHeader },
    });

    if (pageRes.status === 404) {
      return { notFound: true };
    }
    const pageData = pageRes.data;

    let todoData = null;
    try {
      const todoRes = await axios.get(`${baseUrl}/api/page/todo/${encodeURIComponent(name)}`, {
        headers: { cookie: cookieHeader },
      });
      todoData = todoRes.data;
    } catch (todoErr) {
      if (todoErr.response?.status !== 404) {
        throw todoErr;
      }
    }

    return {
      props: {
        userId,
        pageData,
        todoData,
      },
    };
  } catch (error) {
    console.error('getServerSideProps error:', error.response?.status || error.message);

    if (error.response?.status === 401) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    if (error.response?.status === 404) {
      return { notFound: true };
    }

    return { notFound: true };
  }
}
