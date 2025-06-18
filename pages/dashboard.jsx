import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';
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

export async function getServerSideProps() {
  const filePath = path.join(process.cwd(), 'intro.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const processedContent = await remark()
    .use(html)
    .process(fileContents);
  const introHtml = processedContent.toString();

  return {
    props: {
      introHtml,
    },
  };
}
