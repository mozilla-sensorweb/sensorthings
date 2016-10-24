/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express                            from 'express';
import Case                               from 'case';

// Models
import db                                 from './models/db';

// Routes
import { resourceEndpoints, baseRouter }  from './routes/base';
import { route }                          from './utils'

module.exports = (config) => {
  if (!config || !config.db) {
    throw new Error('Missing or malformed config');
  }

  db(config.db);

  let router = express.Router();
  router.use('/', baseRouter);

  resourceEndpoints.forEach(endpoint => {
    router.use(route.generate(endpoint), require('./routes/' + Case.snake(endpoint)));
  });

  return router;
};
