export function renderFooter() {
  const footer = document.getElementById('main-footer');

  footer.innerHTML = `
    <div class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-column">
            <h4>O PastMilhas</h4>
            <a href="#">Quem somos</a>
            <a href="#">Termos e condições</a>
            <a href="#">Política de privacidade</a>
          </div>
          <div class="footer-column">
            <h4>Ajuda</h4>
            <a href="#">Fale conosco</a>
            <a href="#">Perguntas frequentes</a>
            <a href="#">Remarcações e cancelamentos</a>
          </div>
          <div class="footer-column">
            <h4>Formas de Pagamento</h4>
            <a href="#">Cartões de crédito</a>
            <div class="footer-payments">
              <div class="payment-icon" style="background:#EB001B;color:#fff">MC</div>
              <div class="payment-icon" style="background:#1A1F71;color:#fff">VI</div>
              <div class="payment-icon" style="background:#006FCF;color:#fff">AE</div>
              <div class="payment-icon" style="background:#00A4E0;color:#fff">EL</div>
              <div class="payment-icon" style="background:#363636;color:#fff">HP</div>
              <div class="payment-icon" style="background:#8B5CF6;color:#fff">NU</div>
            </div>
            <a href="#" style="margin-top: 8px;">Transferência Pix</a>
            <div style="font-size: 1.5rem; margin-top: 4px;">🟢</div>
          </div>
          <div class="footer-column">
            <h4>Redes Sociais</h4>
            <div class="footer-social">
              <a href="#">🔗 LinkedIn</a>
              <a href="#">📸 Instagram</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-copyright">
            © 2023 – 2026 PastMilhas Ltda | CNPJ 00.000.000/0001-00<br>
            Av. Principal, 100, Loja 01, Centro — Rio de Janeiro — RJ, 20000-000
          </div>
          <div class="footer-badges">
            <div class="footer-badge">✅ Cadastur</div>
            <div class="footer-badge">⭐ RA1000</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
