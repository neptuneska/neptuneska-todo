import React, { useState } from 'react';
import { Modal, Text, TextInput, Group, Button } from '@mantine/core';
import { ChevronRight, Plus } from 'lucide-react';
import { showNotification } from '@mantine/notifications';
import axios from 'axios';
import styles from '../styles/NavLink.module.scss';

export default function NavLink({
  label,
  leftSection,
  childrenOffset = 0,
  defaultOpened = false,
  children,
  onChildCreated,
  isChild = false,
  href = '#',
}) {
  const [opened, setOpened] = useState(defaultOpened);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    href: '',
    icon: '',
    defaultOpened: false,
  });

  async function handleCreate() {
    if (!formData.label.trim()) {
      showNotification({
        title: 'Label requis',
        message: 'Veuillez entrer un nom pour l’élément.',
        color: 'red',
      });
      return;
    }

    try {
      const payload = {
        id: formData.id,
        label: formData.label,
        href: formData.href || '#',
        parentLabel: label,
      };

      const response = await axios.put('/api/sidebar', payload, {
        headers: {
          'x-table': 'child',
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      showNotification({
        title: 'Succès',
        message: `Enfant "${formData.label}" créé avec succès.`,
        color: 'green',
      });

      setModalOpen(false);
      setFormData({ id: '', label: '', icon: '', defaultOpened: false });

      if (onChildCreated) onChildCreated(response.data);
    } catch (error) {
      console.error('Erreur création child:', error);
      showNotification({
        title: 'Erreur',
        message: 'Impossible de créer l’enfant. Vérifiez la console.',
        color: 'red',
      });
    }
  }

  if (isChild) {
    return (
      <a
        href={href}
        className={`${styles.navLinkWrapper} ${leftSection ? styles.withLeftSection : ''} ${styles.childLink}`}
        style={{ paddingLeft: leftSection ? '30px' : '12px', display: 'flex', alignItems: 'center' }}
      >
        {leftSection && <div className={styles.leftSection}>{leftSection}</div>}
        <Text className={styles.label}>{label}</Text>
      </a>
    );
  }

  return (
    <div
      className={`${styles.navLinkWrapper} ${leftSection ? styles.withLeftSection : ''}`}
      style={{ paddingLeft: leftSection ? '30px' : '12px' }}
    >
      <div
        className={`${styles.group} ${children ? '' : styles.noChildren}`}
        onClick={() => children && setOpened((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (children && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpened((o) => !o);
          }
        }}
      >
        {leftSection && <div className={styles.leftSection}>{leftSection}</div>}
        <Text className={styles.label}>{label}</Text>
        {children && (
          <ChevronRight
            size={20}
            className={`${styles.chevron} ${opened ? styles.opened : ''}`}
          />
        )}
        <button
          type="button"
          className={styles.unstyledButton}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setModalOpen(true);
          }}
          aria-label={`Ouvrir le modal pour ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {opened && children && (
        <div className={styles.childrenWrapper} style={{ marginLeft: childrenOffset }}>
          {children}
        </div>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Créer un enfant pour ${label}`}
        centered
      >
        <TextInput
          label="Label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
          required
          mb="sm"
        />

        <TextInput
          label="Lien (href)"
          placeholder="/dashboard/..."
          value={formData.href}
          onChange={(e) => {
            let val = e.currentTarget.value;
            if (!val.startsWith('/dashboard/')) {
              val = '/dashboard/' + val.replace(/^\/dashboard\/?/, '');
            }
            setFormData({ ...formData, href: val });
          }}
          mb="sm"
        />

        <TextInput
          label="Icône (ex: Gauge, Fingerprint)"
          placeholder="Nom icône"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.currentTarget.value })}
          mb="sm"
        />

        <Group position="left" spacing="xs" mb="sm" align="center">
          <label htmlFor="defaultOpened">Ouvert par défaut</label>
          <input
            id="defaultOpened"
            type="checkbox"
            checked={formData.defaultOpened}
            onChange={(e) => setFormData({ ...formData, defaultOpened: e.currentTarget.checked })}
          />
        </Group>

        <Group position="right" mt="md">
          <Button onClick={handleCreate} disabled={!formData.label.trim()}>
            Créer
          </Button>
        </Group>
      </Modal>
    </div>
  );
}