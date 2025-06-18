import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Container,
  Modal,
  TextInput,
  Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus, Fingerprint, Gauge } from 'lucide-react';
import NavLink from './navlink';
import styles from '../styles/Sidebar.module.scss';

const iconMap = {
  Gauge: <Gauge size={16} stroke={1.5} />,
  Fingerprint: <Fingerprint size={16} stroke={1.5} />,
};

function RecursiveNavLinks({ items, isChild = false }) {
  if (!items) return null;

  return items.map((item, idx) => (
    <NavLink
      key={idx}
      href={item.href || '#'}
      label={item.label}
      leftSection={item.icon ? iconMap[item.icon] : null}
      childrenOffset={28}
      defaultOpened={item.defaultOpened}
      isChild={isChild}
      onChildCreated={() => {
        axios.get('/api/sidebar', { withCredentials: true })
          .then(res => setItems(res.data))
          .catch(() => {
            notifications.show({
              title: 'Erreur',
              message: 'Impossible de recharger les données du sidebar.',
              color: 'red',
            });
          });
      }}
    >
      {item.children && (
        <RecursiveNavLinks items={item.children} isChild={true} />
      )}
    </NavLink>
  ));
}

export default function Sidebar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    href: '',
    icon: '',
    defaultOpened: false,
  });

  useEffect(() => {
    axios.get('/api/sidebar', { withCredentials: true })
      .then(res => setItems(res.data))
      .catch(() => {
        notifications.show({
          title: 'Erreur',
          message: 'Échec du chargement du sidebar.',
          color: 'red',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const payload = {
        label: formData.label,
        href: formData.href || '#',
        icon: formData.icon || null,
        defaultOpened: formData.defaultOpened ? 1 : 0,
      };

      await axios.put('/api/sidebar', payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'x-table': 'parent',
        },
      });

      const res = await axios.get('/api/sidebar', { withCredentials: true });
      setItems(res.data);

      notifications.show({
        title: 'Succès',
        message: 'Dashboard parent créé avec succès.',
        color: 'green',
      });

      setModalOpened(false);
      setFormData({
        label: '',
        href: '',
        icon: '',
        defaultOpened: false,
      });
    } catch (error) {
      console.error('Erreur création:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de créer le dashboard.',
        color: 'red',
      });
    }
  };

  return (
    <div className={styles.global}>
      <Container>
        <Button
          className={styles.addButton}
          leftSection={<Plus />}
          variant="outline"
          onClick={() => setModalOpened(true)}
          disabled={loading}
        >
          Ajouter un dashboard
        </Button>

        <RecursiveNavLinks items={items} />

        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Créer un parent"
          centered
        >
          <TextInput
            label="Label"
            value={formData.label}
            onChange={e => setFormData({ ...formData, label: e.currentTarget.value })}
            required
            mb="sm"
          />

          <TextInput
            label="Lien (href)"
            placeholder="#"
            value={formData.href}
            onChange={e => setFormData({ ...formData, href: e.currentTarget.value })}
            mb="sm"
          />

          <TextInput
            label="Icône (ex: Gauge, Fingerprint)"
            placeholder="Nom icône"
            value={formData.icon}
            onChange={e => setFormData({ ...formData, icon: e.currentTarget.value })}
            mb="sm"
          />

          <Group position="left" spacing="xs" mb="sm" align="center">
            <label htmlFor="defaultOpened">Ouvert par défaut</label>
            <input
              id="defaultOpened"
              type="checkbox"
              checked={formData.defaultOpened}
              onChange={e => setFormData({ ...formData, defaultOpened: e.currentTarget.checked })}
            />
          </Group>

          <Group position="right" mt="md">
            <Button onClick={handleCreate} disabled={!formData.label}>
              Créer
            </Button>
          </Group>
        </Modal>
      </Container>
    </div>
  );
}