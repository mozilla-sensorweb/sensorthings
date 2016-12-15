/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express   from 'express';
import logger    from 'morgan-body';
import { snake } from 'case';

// Middlewares
import associations from './middlewares/associations';
import queryParser from './middlewares/query_parser';

// Models
import db from './models/db';

// Routes
import { baseRouter }  from './routes/base';
import { route }  from './utils'

import { entities,
         createObservations } from './constants';

import dataArrayRouter from './extensions/data_array';

const API_VERSION = 'v1.0';

module.exports = (config) => {
  if (!config || !config.db) {
    throw new Error('Missing or malformed config');
  }

  const version = config.api_version || API_VERSION;

  db(config.db);

  let router = express.Router();

  if (process.env.NODE_DEBUG === 'morgan') {
    logger(router);
  }

  router.use('/' + version + '/', baseRouter);

  const routeExpr = route.generate(version);
  router.use(routeExpr, associations(version));
  router.use(routeExpr, queryParser);

  Object.keys(entities).forEach(endpoint => {
    router.use(route.generate(version, endpoint),
               require('./routes/' + snake(endpoint))(version));
  });
  router.use('/' + version + '/' + createObservations,
             dataArrayRouter(version));

  return router;
};
