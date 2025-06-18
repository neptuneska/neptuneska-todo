// _app.js
import '../styles/globals.scss';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/tiptap/styles.css';

function App({ Component, pageProps }) {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      defaultColorScheme='dark'
    >
      <Notifications position="top-right" />
      <Component {...pageProps} />
    </MantineProvider>
  );
}

export default App;