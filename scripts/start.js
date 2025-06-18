import { OpenDatabase } from '../lib/mysql.js';
import { spawn } from 'child_process';

async function start() {
  try {
    // Appliquer les migrations
    await OpenDatabase({ log: true });
    console.log('🚀 Lancement de bun dev...');

    // Lancer bun dev
    const dev = spawn('next', ['dev'], { stdio: 'inherit' });
    
    // S'assurer que le processus se termine correctement
    dev.on('close', (code) => {
      if (code !== 0) {
        console.log(`bun dev a échoué avec le code ${code}`);
      }
    });
  } catch (err) {
    console.error('Erreur lors du démarrage de la DB:', err.message);
    process.exit(1);  // Arrêter le processus si la DB échoue
  }
}

start();  // Appeler la fonction async
