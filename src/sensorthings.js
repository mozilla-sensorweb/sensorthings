/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express              from 'express';

// Models
import db                   from './models/db';

// Routes
import base                 from './routes/base';
import things               from './routes/things';
import locations            from './routes/locations';
import historicalLocations  from './routes/historicalLocations';
import featuresOfInterest   from './routes/featuresOfInterest';
import datastreams          from './routes/datastreams';
import sensors              from './routes/sensors';
import observations         from './routes/observations';
import observedProperties   from './routes/observedProperties';

module.exports = (config) => {
  if (!config || !config.db) {
    throw new Error('Missing or malformed config');
  }

  db(config.db).sequelize.sync().then(() => {
    console.log('Database connection opened');
  });

  let router = express.Router();
  router.get('/', base);
  router.get('/Things', things);
  router.get('/Locations', locations);
  router.get('/HistoricalLocations', historicalLocations);
  router.get('/FeaturesOfInterest', featuresOfInterest);
  router.get('/Datastreams', datastreams);
  router.get('/Sensors', sensors);
  router.get('/Observations', observations);
  router.get('/ObservedProperties', observedProperties);

  return router;
};
