// src/main.tsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // <- MUDANÇA AQUI

// Componente para gerenciar o ciclo de vida e desmontagem
function SafeUnmount({ children }: { children: React.ReactNode }) { // Adicionada tipagem para children
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Função para lidar com a desmontagem
    const handleUnmount = () => {
      setIsMounted(false);
      // Adiciona um pequeno atraso para permitir que os portais do Radix UI sejam limpos
      setTimeout(() => {
        const rootElement = document.getElementById('root');
        if (rootElement) {
          // Em vez de criar uma nova root, usamos a existente para desmontar
          // Esta parte pode não ser necessária dependendo do seu fluxo exato
        }
      }, 100); // Atraso de 100ms
    };

    // Opcional: Adicionar um listener para um evento de desmontagem customizado
    window.addEventListener('unmount-wizard', handleUnmount);

    return () => {
      window.removeEventListener('unmount-wizard', handleUnmount);
    };
  }, []);

  return isMounted ? children : null;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SafeUnmount>
        <App />
      </SafeUnmount>
    </React.StrictMode>
  );
}