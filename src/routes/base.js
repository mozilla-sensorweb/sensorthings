import express from 'express';

const resourceEndpoints = [
  'Datastreams',
  'FeaturesOfInterest',
  'HistoricalLocations',
  'Locations',
  'Observations',
  'ObservedProperty',
  'Sensors',
  'Things'
];

exports.resourceEndpoints = resourceEndpoints;

let router = express.Router();

/**
 * Implementation of 9.2.1 "Usage 1: no resource path" of the SensorThings
 * spec.
 * Response: A JSON object with a property named value. The value of the
 * property SHALL be a JSON Array containing one element for each entity set of
 * the SensorThings Service.
 *
 * Each element SHALL be a JSON object with at least two name/value pairs,
 * one with name 'name' containing the name of the entity set (e.g., Things,
 * Locations, Datastreams, Observations, ObservedProperties and Sensors)
 * and one with name 'url' containing the URL of the entity set, which may be
 * an absolute or a relative URL.
 * Example Request:
 * http://example.org/v1.0/
 *
 * Example Response:
 * {"value": [{
 *    "name": "Things",
 *    "url": "http://example.org/v1.0/Things"
 *  }, {
 *    "name": "Locations",
 *    "url": " http://example.org/v1.0/Locations"
 *  }, {
 *    "name": "Datastreams",
 *    "url": " http://example.org/v1.0/Datastreams"
 *  }, {
 *    "name": "Sensors",
 *    "url": " http://example.org/v1.0/Sensors"
 *  }, {
 *    "name": "Observations",
 *    "url": " http://example.org/v1.0/Observations"
 *  }, {
 *    "name": "ObservedProperties",
 *    "url": "http://example.org/v1.0/ObservedProperties"
 * }, {
 *    "name": "FeaturesOfInterest",
 *    "url": "http://example.org/v1.0/FeaturesOfInterest"
 *  }]
 * }
 **/

router.get('/', (req, res) => {
  const prepath = req.protocol + '://' + req.hostname + req.baseUrl + '/';

  const value = resourceEndpoints.map(key => {
    return {
      'name'  : key,
      'url'   : prepath + key
    };
  });

  res.status(200).send({ value: value });
});

module.exports = router;
