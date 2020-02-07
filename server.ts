/***************************************************************************************************
 * Load `$localize` onto the global scope - used if i18n tags appear in Angular templates.
 */
import '@angular/localize/init';
import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import { environment } from './src/environments/environment';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';


// The Express app is exported so that it can be used by serverless Functions.
export function app() {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/ng9-localize-ssr/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // app.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // We manually disable view cache to prevent caching bug when switching to a different locale url
  server.disable('view cache');

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {

    if (environment.production) {

      // We manually read the locale to serve the correct i18n build flavor dynamically

      const contextRoot = req.url.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
      const locale = Array.isArray(contextRoot) ? contextRoot[1] : 'en';
      // tslint:disable-next-line:variable-name
      const _distFolder = join(distFolder, locale);
      // tslint:disable-next-line:variable-name
      const _indexHtml = existsSync(join(_distFolder, 'index.original.html')) ? 'index.original.html' : 'index.html';

      server.set('views', _distFolder);
      server.get('*.*', express.static(_distFolder, {
        maxAge: '1y'
      }));

      res.render(_indexHtml, {
        req, providers: [{provide: APP_BASE_HREF, useValue: `/${locale}`}]
      });

    } else {
      res.render(indexHtml, {req, providers: [{provide: APP_BASE_HREF, useValue: `/`}]});
    }
  });

  return server;
}

function run() {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
if (mainModule && mainModule.filename === __filename) {
  run();
}

export * from './src/main.server';
