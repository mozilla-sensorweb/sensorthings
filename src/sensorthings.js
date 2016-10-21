import express from 'express';
import base    from './routes/base';
import things    from './routes/things';
import locations    from './routes/locations';
import historicalLocations    from './routes/historicalLocations';
import featuresOfInterest    from './routes/featuresOfInterest';
import datastreams    from './routes/datastreams';
import sensors    from './routes/sensors';
import observations    from './routes/observations';
import observedProperties    from './routes/observedProperties';

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

module.exports = router;
