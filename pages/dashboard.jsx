import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Dashboard.module.scss';

export default function Dashboard({ introHtml }) {
  return (
    <div className={styles.global}>
      <Sidebar />
      <div className={styles.container}>
        <div dangerouslySetInnerHTML={{ __html: introHtml }} />
      </div>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Récupérer le header cookie de la requête client
  const cookieHeader = req.headers.cookie || '';

  try {
    // Vérifier le token en appelant l'API interne
    const verifyRes = await axios.get(`${baseUrl}/api/verify-token`, {
      headers: { cookie: cookieHeader },
      // Important: pour éviter la redirection automatique (en dev, axios ne suit pas automatiquement)
      validateStatus: () => true,
    });

    if (verifyRes.status !== 200) {
      // Token invalide ou absent => redirection vers login
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Ici, le token est valide, on continue
    const filePath = path.join(process.cwd(), 'intro.md');
    const fileContents = fs.readFileSync(filePath, 'utf8');

    const processedContent = await remark().use(html).process(fileContents);
    const introHtml = processedContent.toString();

    return {
      props: {
        introHtml,
      },
    };
  } catch (error) {
    console.error('Erreur dans getServerSideProps:', error);

    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}