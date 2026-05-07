import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { playUiSe } from './uiSe'

// React 画面のすべての <button> クリックでクリック SE を鳴らす。
// data-no-se 属性が付いた button (ゲーム中の HUD ボタン等) は除外。
document.addEventListener('pointerdown', (ev) => {
  const t = ev.target;
  if (!t || !(t instanceof Element)) return;
  const btn = t.closest('button');
  if (!btn) return;
  if (btn.disabled) return;
  if (btn.hasAttribute('data-no-se')) return;
  playUiSe('click');
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
