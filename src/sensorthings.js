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

module.exports = (config) => {
  if (!config || !config.db) {
    throw new Error('Missing or malformed config');
  }

  db(config.db);

  let router = express.Router();
  router.use('/', baseRouter);

  router.use(route.generate(), associations);

  entities.forEach(endpoint => {
    router.use(route.generate(endpoint),
               require('./routes/' + snake(endpoint)));
  });

  return router;
};
