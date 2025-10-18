import { createRoot } from 'react-dom/client'
import './index.css';
import App from './App.tsx';
import { UiProvider } from './app/providers/UiProvider';

createRoot(document.getElementById('root')!).render(
  <UiProvider>
    <App />
  </UiProvider>
);
