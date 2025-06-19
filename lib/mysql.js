import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

dotenv.config();

let pool;

/**
 * Retourne une instance de pool MySQL. Initialise le pool si nécessaire.
 * @returns {import('mysql2/promise').Pool}
 */
export function GetDatabase() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

/**
 * Applique les migrations SQL contenues dans le dossier ./migration.
 * @param {Object} options Options
 * @param {boolean} options.log Affiche les logs si vrai
 * @throws {Error} Lance une erreur si une ou plusieurs migrations échouent
 */
export async function OpenDatabase({ log = false } = {}) {
  const db = GetDatabase();

  const migrationDir = path.resolve('./migration');
  const files = fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const failedMigrations = [];

  if (log) console.log(chalk.blueBright('\n📦 Application des migrations :\n'));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    const label = `${file} `.padEnd(60, '.');

    try {
      await db.execute(sql);
      if (log) console.log(`${label} ${chalk.green('[Success]')}`);
    } catch (err) {
      failedMigrations.push({ file, error: err.message });
      if (log) {
        console.log(`${label} ${chalk.red('[Fail]')}`);
        console.error(chalk.red(`    ↳ Erreur : ${err.message}`));
      }
    }
  }

  if (failedMigrations.length > 0) {
    const errorMsg = `❌ ${failedMigrations.length} migration(s) ont échoué. Annulation du démarrage.\n`;
    if (log) console.log(chalk.redBright(`\n${errorMsg}`));
    throw new Error(errorMsg);
  }

  if (log) console.log(chalk.greenBright('\n✅ Initialisation terminée.\n'));
}

/**
 * Authentifie un utilisateur via son username et mot de passe.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<null|Object>} L'objet utilisateur si authentifié, sinon null
 */
export async function authenticateUser(username, password) {
  const db = GetDatabase();
  const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

  if (rows.length === 0) return null;

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  return match ? user : null;
}

/**
 * Récupère les informations publiques d'un utilisateur.
 * @param {number} userId
 * @returns {Promise<null|Object>} Objet avec username, role, imagePath, email, ou null si introuvable
 */
export async function getUserInfo(userId) {
  if (!userId) throw new Error('userId est requis et ne doit pas être undefined');

  const db = GetDatabase();

  try {
    const [rows] = await db.execute(
      'SELECT username, role, imagePath, email FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) return null;

    return rows[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    throw error;
  }
}

/**
 * Met à jour les informations utilisateur.
 * @param {number} userId
 * @param {Object} newInfo
 * @param {string} newInfo.username
 * @param {string} newInfo.email
 * @returns {Promise<null|Object>} Les nouvelles infos mises à jour, ou null si utilisateur introuvable
 */
export async function updateUserInfo(userId, newInfo) {
  const db = GetDatabase();

  try {
    const { username, email } = newInfo;
    const [result] = await db.execute(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username, email, userId]
    );

    if (result.affectedRows === 0) return null;

    return { username, email };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
    throw error;
  }
}

/**
 * Réinitialise le mot de passe d'un utilisateur en générant un mot de passe aléatoire à 8 chiffres.
 * @param {number} userId
 * @returns {Promise<string>} Le nouveau mot de passe non hashé à envoyer à l'utilisateur
 */
export async function ResetPassword(userId) {
  const db = GetDatabase();

  const password = Array.from({ length: 8 }, () => randomInt(0, 10)).join('');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return password;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw new Error('Échec de la mise à jour du mot de passe.');
  }
}

/**
 * Récupère tous les parents.
 * @returns {Promise<Array>} Liste des parents
 */
export async function GetParent() {
  const db = GetDatabase();
  const [rows] = await db.execute(
    'SELECT id, label, href, icon, defaultOpened FROM parent ORDER BY id ASC'
  );
  return rows;
}

/**
 * Récupère les enfants d'un parent donné.
 * @param {number} parentId
 * @returns {Promise<Array>} Liste des enfants
 */
export async function GetChild(parentId) {
  const db = GetDatabase();
  const [rows] = await db.execute(
    'SELECT id, label, href FROM child WHERE parent_id = ? ORDER BY id ASC',
    [parentId]
  );
  return rows;
}

/**
 * Insère ou met à jour un parent.
 * @param {Object} parentData
 * @param {number} [parentData.id] ID du parent (optionnel pour update)
 * @param {string} parentData.label
 * @param {string} [parentData.href='#']
 * @param {string|null} [parentData.icon=null]
 * @param {boolean|number} [parentData.defaultOpened=0]
 * @returns {Promise<void>}
 */
export async function SaveParent(parentData) {
  const db = GetDatabase();

  const {
    id,
    label,
    href = '#',
    icon = null,
    defaultOpened = 0,
  } = parentData;

  if (id) {
    await db.execute(
      'UPDATE parent SET label = ?, href = ?, icon = ?, defaultOpened = ? WHERE id = ?',
      [label, href, icon, defaultOpened ? 1 : 0, id]
    );
  } else {
    await db.execute(
      'INSERT INTO parent (label, href, icon, defaultOpened) VALUES (?, ?, ?, ?)',
      [label, href, icon, defaultOpened ? 1 : 0]
    );
  }
}

/**
 * Insère ou met à jour un enfant.
 * @param {Object} childData
 * @param {number} [childData.id] ID de l'enfant (optionnel pour update)
 * @param {number} childData.parentId
 * @param {string} childData.label
 * @param {string} [childData.href='#']
 * @returns {Promise<void>}
 * @throws {Error} Si parentId manquant
 */
export async function SaveChild(childData) {
  const db = GetDatabase();

  const {
    id,
    parentId,
    label,
    href = '#',
  } = childData;

  if (!parentId) throw new Error('parentId est obligatoire pour un enfant');

  if (id) {
    await db.execute(
      'UPDATE child SET parent_id = ?, label = ?, href = ? WHERE id = ?',
      [parentId, label, href, id]
    );
  } else {
    await db.execute(
      'INSERT INTO child (parent_id, label, href) VALUES (?, ?, ?)',
      [parentId, label, href]
    );
  }
}

/**
 * Supprime un parent par ID.
 * @param {number} parentId
 * @returns {Promise<void>}
 */
export async function DeleteParent(parentId) {
  const db = GetDatabase();
  await db.execute('DELETE FROM parent WHERE id = ?', [parentId]);
}

/**
 * Supprime un enfant par ID.
 * @param {number} childId
 * @returns {Promise<void>}
 */
export async function DeleteChild(childId) {
  const db = GetDatabase();
  await db.execute('DELETE FROM child WHERE id = ?', [childId]);
}

/**
 * Récupère le statut d'onboarding depuis la base de données.
 * Renvoie la valeur de la colonne 'yes' (0 ou 1).
 * Si aucune ligne n'existe, retourne 0 par défaut.
 *
 * @async
 * @function
 * @returns {Promise<number>} La valeur de 'yes' dans la table onboarding.
 */
export async function getOnboardingStatus() {
  const db = GetDatabase();
  const [rows] = await db.query('SELECT yes FROM onboarding LIMIT 1');
  return rows.length > 0 ? rows[0].yes : 0;
}

/**
 * Met à jour les données d'onboarding : 
 * - Crée l'utilisateur admin
 * - Active l'onboarding (`yes = 1`)
 * - Enregistre le site dans `ra_todo`
 * 
 * @param {Object} data - Données de l'onboarding
 * @param {string} data.siteName - Nom du site
 * @param {string} data.adminEmail - Email de l'admin
 * @param {string} data.username - Nom d'utilisateur
 * @param {string} data.password - Mot de passe en clair
 * @returns {Promise<void>}
 */
export async function setOnboardingDone({ siteName, adminEmail, username, password }) {
  const db = GetDatabase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();


    await conn.query(
      `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
      [username, hashedPassword, adminEmail]
    );

    await conn.query(`UPDATE onboarding SET yes = 1 LIMIT 1`);

    await conn.query(
      `INSERT INTO site (SiteName) VALUES (?)`,
      [siteName]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Récupère la liste des todos.
 * @returns {Promise<Array>} Liste des todos.
 */
export async function todo() {
  const db = GetDatabase();
  const [rows] = await db.query('SELECT * FROM ra_todo ORDER BY id DESC');
  return rows;
}

/**
 * Ajoute une tâche todo.
 * @param {Object} task - Les données de la tâche à ajouter.
 * @param {string} task.label - Le label de la tâche.
 * @param {boolean} task.completed - Statut de complétion.
 * @returns {Promise<number>} ID de la tâche insérée.
 */
export async function addTodoTask(pageName, label) {
  const db = GetDatabase();


  const [todos] = await db.query('SELECT id FROM ra_todo WHERE page_name = ? LIMIT 1', [pageName]);
  if (todos.length === 0) throw new Error('Todo not found');

  const todoId = todos[0].id;


  const [maxPosResult] = await db.query('SELECT MAX(position) as maxPos FROM ra_tasks WHERE todo_id = ?', [todoId]);
  const maxPosition = maxPosResult[0].maxPos ?? 0;


  await db.query(
    'INSERT INTO ra_tasks (todo_id, label, finished, position) VALUES (?, ?, false, ?)',
    [todoId, label, maxPosition + 1]
  );
}

/**
 * Met à jour une tâche todo.
 * @param {number} id - L'ID de la tâche à mettre à jour.
 * @param {Object} updates - Les champs à mettre à jour.
 * @param {string} [updates.label] - Nouveau label.
 * @param {boolean} [updates.completed] - Nouveau statut complété.
 * @returns {Promise<boolean>} true si mise à jour réussie.
 */
export async function updateTodoTask(todoName, taskId, finished) {
  const [todos] = await db.query('SELECT id FROM ra_tasks WHERE name = ?', [todoName]);
  if (todos.length === 0) throw new Error('Todo not found');
  const todoId = todos[0].id;

  await db.query(
    'UPDATE tasks SET finished = ? WHERE id = ? AND todo_id = ?',
    [finished ? 1 : 0, taskId, todoId]
  );
}