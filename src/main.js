/**
 * Ponto de entrada: verifica suporte a WebGL e sobe a aplicação.
 * Qualquer falha vira uma mensagem legível em vez de tela preta silenciosa.
 */

import './styles/main.css';
import { createApp } from './app/App.js';

function showFatal(title, message) {
  const container = document.getElementById('fatal');
  const titleElement = document.getElementById('fatal-title');
  const bodyElement = document.getElementById('fatal-body');
  if (!container || !titleElement || !bodyElement) return;
  titleElement.textContent = title;
  bodyElement.textContent = message;
  container.hidden = false;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const viewport = document.getElementById('viewport');

if (!viewport) {
  showFatal('Falha na inicialização', 'O contêiner da cena (#viewport) não foi encontrado.');
} else if (!supportsWebGL()) {
  showFatal(
    'WebGL indisponível',
    'Este navegador não oferece aceleração 3D por WebGL. Atualize o navegador ou habilite a aceleração de hardware.',
  );
} else {
  try {
    createApp(viewport);
  } catch (error) {
    console.error(error);
    showFatal(
      'Não foi possível iniciar a visualização',
      error instanceof Error ? error.message : String(error),
    );
  }
}
