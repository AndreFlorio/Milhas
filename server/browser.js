/**
 * Browser launcher — local (Playwright) e Vercel/serverless (@sparticuz/chromium)
 */
export async function launchBrowser() {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV
  );

  if (isServerless) {
    const chromiumPkg = await import('@sparticuz/chromium');
    const { chromium } = await import('playwright-core');
    const chromiumModule = chromiumPkg.default || chromiumPkg;

    chromiumModule.setGraphicsMode = false;

    return chromium.launch({
      args: chromiumModule.args,
      executablePath: await chromiumModule.executablePath(),
      headless: chromiumModule.headless,
    });
  }

  const { chromium } = await import('playwright');
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

/** TAP exige sobrenome — se usuário digitar nome completo, usa a última palavra */
export function normalizeLastName(name) {
  const cleaned = name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return cleaned;
  return parts[parts.length - 1];
}
