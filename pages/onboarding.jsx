import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Card, TextInput, PasswordInput, Button, Title, Group } from '@mantine/core';
import styles from '../styles/onboarding.module.scss';

export default function Onboarding() {
  const router = useRouter();

  const [form, setForm] = useState({
    siteName: '',
    adminEmail: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/onboarding');
        if (!res.ok) throw new Error('Erreur serveur');
        const data = await res.json();
        if (data.yes === 1) {
          router.push('/login');
        }
        // else on reste sur la page
      } catch (error) {
        console.error('Erreur lors du check onboarding:', error);
      }
    }
    checkOnboarding();
  }, [router]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const response = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteName: form.siteName,
          adminEmail: form.adminEmail,
          username: form.username,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Serveur'}`);
        return;
      }

      alert('Onboarding terminé avec succès !');
      router.push('/login');
    } catch (err) {
      alert('Erreur réseau ou serveur');
      console.error(err);
    }
  };

  const isSubmitDisabled =
    !form.siteName ||
    !form.adminEmail ||
    !form.username ||
    !form.password ||
    !form.confirmPassword ||
    form.password !== form.confirmPassword;

  return (
    <Container size={420} className={styles.onboardingContainer}>
      <Card shadow="sm" padding="lg" className={styles.onboardingCard}>
        <Title order={2} className={styles.onboardingTitle}>
          Welcomeeeeeeee
        </Title>

        <TextInput
          label="Nom du site"
          placeholder="Mon super site"
          value={form.siteName}
          onChange={handleChange('siteName')}
          mb="sm"
          required
        />

        <TextInput
          label="Email de l'administrateur"
          placeholder="admin@monsite.com"
          value={form.adminEmail}
          onChange={handleChange('adminEmail')}
          mb="sm"
          required
          type="email"
        />

        <TextInput
          label="Nom d'utilisateur"
          placeholder="admin"
          value={form.username}
          onChange={handleChange('username')}
          mb="sm"
          required
        />

        <PasswordInput
          label="Mot de passe"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          mb="sm"
          required
        />

        <PasswordInput
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          mb="sm"
          required
        />

        <Group position="right" mt="xl">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            Valider
          </Button>
        </Group>
      </Card>
    </Container>
  );
}