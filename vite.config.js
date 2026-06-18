import { defineConfig, loadEnv } from 'vite';
import { createFlightSearchMiddleware } from './server/flights-search.js';

function flightApiPlugin(env) {
  const middleware = createFlightSearchMiddleware(env);

  return {
    name: 'flight-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [flightApiPlugin(env)],
    server: { port: 5173 },
  };
});
