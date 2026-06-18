import { defineConfig, loadEnv } from 'vite';
import { createFlightSearchMiddleware } from './server/flights-search.js';
import { createReservationLookupMiddleware } from './server/reservation-lookup.js';

function apiPlugin(env) {
  const flightMw = createFlightSearchMiddleware(env);
  const lookupMw = createReservationLookupMiddleware();

  const attach = (server) => {
    server.middlewares.use(flightMw);
    server.middlewares.use(lookupMw);
  };

  return {
    name: 'api-routes',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [apiPlugin(env)],
    server: { port: 5173 },
  };
});
