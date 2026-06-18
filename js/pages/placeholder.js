export function renderPlaceholder(title, description) {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="container" style="padding:80px 0;text-align:center">
      <div style="font-size:3rem;margin-bottom:16px">🚧</div>
      <h2 style="margin-bottom:8px">${title}</h2>
      <p style="color:var(--text-secondary);max-width:400px;margin:0 auto">${description}</p>
    </div>
  `;
}
