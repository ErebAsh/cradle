
(function() {
 
  const style = document.createElement('style');
  style.textContent = `
    .cradle-back-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(15, 23, 42, 0.75);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      z-index: 99999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .cradle-back-btn:hover {
      background: rgba(15, 23, 42, 0.9);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      border-color: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }
    .cradle-back-btn svg {
      transition: transform 0.3s ease;
    }
    .cradle-back-btn:hover svg {
      transform: translateX(-2px);
    }
    @media (max-width: 768px) {
      .cradle-back-btn {
        bottom: 12px;
        right: 12px;
        padding: 8px 12px;
        font-size: 12px;
      }
    }
  `;
  document.head.appendChild(style);

  const link = document.createElement('a');
  link.className = 'cradle-back-btn';
  link.href = '../../../index.html';
  link.title = 'Back to Cradle Home';
  
  link.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
    <span>Back to Home</span>
  `;

 
  if (document.body) {
    document.body.appendChild(link);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(link);
    });
  }
})();
