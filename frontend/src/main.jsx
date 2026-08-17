import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './styles/global.css';

/* Apply saved theme before first paint – prevents flash */
const saved = localStorage.getItem('ck-theme') || 'dark';
document.documentElement.setAttribute('data-theme', saved);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              gutter={8}
              containerStyle={{ top: 64 }}
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--s2)',
                  color: 'var(--t1)',
                  border: '1px solid var(--border2)',
                  fontSize: 13,
                  borderRadius: 'var(--r)',
                  backdropFilter: 'blur(20px)',
                },
                success: { iconTheme: { primary: 'var(--acc2)', secondary: 'var(--s2)' } },
                error:   { iconTheme: { primary: 'var(--rose)',  secondary: 'var(--s2)' }, duration: 5000 },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

