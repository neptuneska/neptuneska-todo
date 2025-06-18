import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; 
import axios from 'axios';
import {
  TextInput,
  PasswordInput,
  Button,
  Container,
  Paper,
  Title,
  Text,
  Stack,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import styles from '../styles/login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      try {
        await axios.get('/api/verifytoken', { withCredentials: true });
        router.replace('/dashboard');
      } catch {
        setCheckingToken(false);
      }
    }
    verifyToken();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post('/api/login', {
        username,
        password,
      }, {
        withCredentials: true,
      });

      if (res.status === 200) {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err.response) {
        showNotification({
          title: 'Erreur de connexion',
          message: err.response.data.message || 'Échec de la connexion',
          color: 'red',
        });
      } else {
        showNotification({
          title: 'Erreur serveur',
          message: 'Erreur de serveur',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return <p>Vérification de la session...</p>;
  }

  return (
    <div className={styles.centeredContainer}>
      <Container size={420} style={{ zIndex: 1 }}>
        <Title align="center" c="white">Bienvenue</Title>
        <Text color="dimmed" size="sm" align="center" mt={5}>
          Accéder à votre compte avec vos identifiants
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Nom d'utilisateur"
                placeholder="chtrg"
                required
                name="username"
              />
              <PasswordInput
                label="Mot de passe"
                placeholder="********"
                required
                name="password"
              />
              <Button type="submit" fullWidth loading={loading}>
                Connexion
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
}