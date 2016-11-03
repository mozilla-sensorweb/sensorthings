import db       from '../models/db';
import express  from 'express';
import response from '../response';
import * as Err from '../errors';

const resource       = 'Sensors';
const excludedFields = ['createdAt', 'updatedAt'];
const associations   = ['Datastreams'];

// XXX [Sensors router] Implement associations #17

let router = express.Router({ mergeParams: true });

/**
 * Implementation of 8.3.2 "Location"
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
 * http://example.org/v1.0/Sensors
 *
 * Example Response:
 * {
 *   "@iot.count":84,
 *   "value": [
 *    {
 *      "@iot.id": 1,
 *      "@iot.selfLink": "http://example.org/v1.0/Sensors(1)",
 *      "Datastreams@iot.navigationLink": "Sensors(1)/Datastreams",
 *      "description": "TMP36 - Analog Temperature sensor",
 *      "encodingType": "application/pdf",
 *      "metadata": "http://example.org/TMP35_36_37.pdf"
 *      {...}
 *    }
 *    ]
 *    "@iot.nextLink":
 *      "http://example.org/v1.0/ObservedProperties?$top=5&$skip=5"
 * }
 **/

router.get('', (req, res) => {
  db().then(models => {
    if (req.params && req.params[0]) {
      models.Sensors.findById(req.params[0], {
        attributes: {
          exclude: excludedFields
        }
      }).then(sensor => {
        if (!sensor) {
          return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                              Err.NOT_FOUND);
        }
        res.status(200).send(response.generate(sensor, associations));
      });
    } else {
      models.Sensors.findAll({
        attributes: {
          exclude: excludedFields
        }
      }).then(sensors => {
        res.status(200).send(response.generate(sensors, associations));
      });
    }
  }).catch(() => {
    Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
  });
});

router.post('/', (req, res) => {
  db().then((models) => {
    models.Sensors.create(req.body)
    .then(sensor => {
      // XXX #13 Response urls should be absolute
      res.location('/' + resource + '(' + sensor.id + ')');
      res.status(201).send(response.generate(sensor, associations));
    }).catch(err => {
      switch (err.name) {
        case Err.modelErrors[Err.VALIDATION_ERROR]:
          Err.ApiError(res, 400, Err.ERRNO_VALIDATION_ERROR, Err.BAD_REQUEST,
                     JSON.stringify(err.errors));
          break;
        default:
          Err.ApiError(res, 400, Err.ERRNO_BAD_REQUEST, Err.BAD_REQUEST,
                     JSON.stringify(err.errors));
      }
    });
  }).catch(() => {
    Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
  });
});

router.patch('', (req, res) => {
  const id = req.params && req.params[0];
  if (!id) {
    return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND, Err.NOT_FOUND);
  }

  db().then(models => {
    Reflect.deleteProperty(req.body, 'id');
    models.updateInstance('Sensors', id, req.body, excludedFields)
    .then(sensor => {
      res.location('/' + resource + '(' + id + ')');
      res.status(200).json(response.generate(sensor, associations));
    }).catch(err => {
      switch (err.name) {
        case Err.modelErrors[Err.VALIDATION_ERROR]:
          Err.ApiError(res, 400, Err.ERRNO_VALIDATION_ERROR, Err.BAD_REQUEST,
                     JSON.stringify(err.errors));
          break;
        case Err.NOT_FOUND:
          Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND, Err.NOT_FOUND,
                     JSON.stringify(err.errors));
          break;
        default:
          Err.ApiError(res, 400, Err.ERRNO_BAD_REQUEST, Err.BAD_REQUEST,
                     JSON.stringify(err.errors));
      }
    });
  }).catch(() => {
    Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
  });
});

router.delete('', (req, res) => {
  if (!req.params || !req.params[0]) {
    return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND, Err.NOT_FOUND);
  }

  db().then(models => {
    models.Sensors.destroy({
      where: { id: req.params[0] }
    }).then(count => {
      if (!count) {
        return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                            Err.NOT_FOUND);
      }
      res.status(204).send();
    });
  }).catch(() => {
    Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
  });
});

module.exports = router;
