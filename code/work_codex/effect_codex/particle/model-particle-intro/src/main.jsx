import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const container = document.getElementById('particle-root');
const root = createRoot(container);

root.render(<App />);

window.unmountParticleIntro = function () {
  root.unmount();
  delete window.unmountParticleIntro;
};
