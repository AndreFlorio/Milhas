import { router } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';
import { renderAgency } from './pages/agency.js';
import { renderManageReservation } from './pages/manage-reservation.js';
import { renderReservationDetail } from './pages/reservation-detail.js';
import { renderPlaceholder } from './pages/placeholder.js';

function render() {
  renderHeader();
  renderFooter();
}

router
  .on('/', () => { render(); renderHome(); })
  .on('/buscar', (params) => { render(); renderSearch(params); })
  .on('/minha-agencia', () => { render(); renderAgency(); })
  .on('/gerenciar-reserva', () => { render(); renderManageReservation(); })
  .on('/reserva', (params) => { render(); renderReservationDetail(params); })
  .on('/vender-milhas', () => {
    render();
    renderPlaceholder('Vender milhas', 'Em breve você poderá vender suas milhas diretamente pela plataforma.');
  })
  .on('/minhas-compras', () => {
    render();
    renderPlaceholder('Minhas compras', 'Acompanhe o histórico de passagens adquiridas.');
  })
  .on('/minhas-ofertas', () => {
    render();
    renderPlaceholder('Minhas ofertas', 'Gerencie suas ofertas de milhas ativas.');
  });

if (!window.location.hash) {
  window.location.hash = '/';
}

router.resolve();
