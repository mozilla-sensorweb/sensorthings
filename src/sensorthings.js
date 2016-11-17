/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express   from 'express';
import { snake } from 'case';

// Middlewares
import associations from './middlewares/associations';

// Models
import db from './models/db';

// Routes
import { baseRouter }  from './routes/base';
import { route }  from './utils'

import { entities } from './constants';

const API_VERSION = 'v1.0';

module.exports = (config) => {
  if (!config || !config.db) {
    throw new Error('Missing or malformed config');
  }

  const version = config.api_version || API_VERSION;

  db(config.db);

  let router = express.Router();
  router.use('/' + version + '/', baseRouter);

  router.use(route.generate(version), associations(version));

  entities.forEach(endpoint => {
    router.use(route.generate(version, endpoint),
               require('./routes/' + snake(endpoint)));
  });

  return router;
};
