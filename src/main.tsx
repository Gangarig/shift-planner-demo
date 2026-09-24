import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import './index.css'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'

const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 7,
  colors: {
    blue: [
      '#f0f6fb',
      '#e1edf6',
      '#c3daec',
      '#a3c5df',
      '#80adce',
      '#6195b9',
      '#477fa7',
      '#346b91',
      '#295978',
      '#234b65',
    ],
  },
  defaultRadius: 'md',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <LanguageProvider>
        <Notifications position="top-right" />
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </LanguageProvider>
    </MantineProvider>
  </StrictMode>,
)
