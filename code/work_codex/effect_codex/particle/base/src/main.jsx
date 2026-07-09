import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootEl1 = document.getElementById('Fpage')

  createRoot(rootEl1).render(
    <>
      <App />
    </>
  )



