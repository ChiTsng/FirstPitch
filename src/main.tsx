import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/field.css';
import './styles/components.css';
import './styles/controls.css';
import './styles/effects.css';
import './styles/experience.css';
import './styles/teaching.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
