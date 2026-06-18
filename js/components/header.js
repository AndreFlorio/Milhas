import { router } from '../router.js';
import { store } from '../store.js';
import { formatCurrency } from '../utils/formatters.js';

export function renderHeader() {
  const header = document.getElementById('main-header');
  const wallet = store.getWallet();
  const currentRoute = router.getCurrentRoute();

  const navItems = [
    { path: '/', label: '✈ Passagens aéreas', id: 'nav-flights' },
    { path: '/vender-milhas', label: '💰 Vender milhas', id: 'nav-sell' },
    { path: '/minhas-compras', label: '🛒 Minhas compras', id: 'nav-purchases' },
    { path: '/minhas-ofertas', label: '🏷️ Minhas ofertas', id: 'nav-offers' },
    { path: '/minha-agencia', label: '✈ Minha agência', id: 'nav-agency' },
  ];

  header.innerHTML = `
    <div class="site-header">
      <div class="header-top">
        <div class="logo" id="logo-home">
          <div class="logo-icon">✈</div>
          Past<span>Milhas</span>
        </div>
        <div class="header-wallet" id="wallet-btn">
          <span>💳</span>
          <span>${formatCurrency(wallet.balance)}</span>
          <span>▾</span>
        </div>
      </div>
      <nav class="header-nav">
        <div class="nav-list" id="nav-list">
          ${navItems.map(item => `
            <a class="nav-item ${currentRoute === item.path ? 'active' : ''}" 
               data-path="${item.path}" id="${item.id}">
              ${item.label}
            </a>
          `).join('')}
        </div>
      </nav>
    </div>
  `;

  // Logo click
  header.querySelector('#logo-home').addEventListener('click', () => {
    router.navigate('/');
  });

  // Nav clicks
  header.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(item.dataset.path);
    });
  });
}
