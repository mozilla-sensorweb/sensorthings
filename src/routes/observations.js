import express from 'express';

let router = express.Router();

/**
 * Implementation of 8.3.7 "Observation"
 * The OGC SensorThings API follows the ITU-T definition, i.e., with regard
 * to the Internet of Things, a thing is an object of the physical world
 * (physical things) or the information world (virtual things) that is capable
 * of being identified and integrated into communication networks
 * [ITU-T Y.2060].
 *
 * Response: A list of all entities (with all the properties) in the specified
 * entity set when there is no service-driven pagination imposed. The response
 * is represented as a JSON object containing a name/value pair named value.
 * The value of the value name/value pair is a JSON array where each element
 * is representation of an entity or a representation of an entity reference.
 * An empty collection is represented as an empty JSON array.
 *
 * Each element SHALL be a JSON object with at least two name/value pairs,
 * one with name 'name' containing the name of the entity set (e.g., Things,
 * Locations, Datastreams, Observations, ObservedProperties and Sensors)
 * and one with name 'url' containing the URL of the entity set, which may be
 * an absolute or a relative URL.
 * Example Request:
 * http://example.org/v1.0/Observations
 *
 * Example Response:
 * {
 *   "@iot.count":84,
 *   "value": [
 *    {
 *      "@iot.id": 1,
 *      "@iot.selfLink": "http://example.org/v1.0/Observations(1)",
 *      "FeatureOfInterest@iot.navigationLink":
 *        "Observations(1)/FeatureOfInterest",
 *      "Datastream@iot.navigationLink":"Observations(1)/Datastream",
 *      "phenomenonTime": "2014-12-31T11:59:59.00+08:00",
 *      "resultTime": "2014-12-31T11:59:59.00+08:00",
 *      "result": 70.4
 *    },
 *    {...}
 *    ]
 *    "@iot.nextLink":"http://example.org/v1.0/Observations?$top=5&$skip=5"
 * }
 **/

router.get('/', (req, res) => {
  res.status(200).send();
});

module.exports = router;
