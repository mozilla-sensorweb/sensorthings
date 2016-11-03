import express    from 'express';
import db         from '../models/db';
import response   from '../response';
import * as Err from '../errors';

let router = express.Router({ mergeParams: true });
const excludedFields = ['createdAt', 'updatedAt'];

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
 * http://example.org/v1.0/Locations
 *
 * Example Response:
 * {
 *   "@iot.count":84,
 *   "value": [
 *    {
 *      "@iot.id": 1,
 *      "@iot.selfLink": "http://example.org/v1.0/Things(1)",
 *      "Locations@iot.navigationLink": "Things(1)/Locations",
 *      "Datastreams@iot.navigationLink": "Things(1)/Datastreams",
 *      "HistoricalLocations@iot.navigationLink": "Things(1)/Historical...",
 *      "description": "This thing is an oven.",
 *      "properties": {
 *        "owner": "John Doe",
 *        "color": "Silver"
 *      },
 *      {...}
 *    }
 *    ]
 *    "@iot.nextLink":"http://example.org/v1.0/Locations?$top=5&$skip=5"
 * }
 **/

const resource = 'Locations';

router.get('/', (req, res) => {
  db().then(models => {
    if (req.params && req.params[0]) {
      models[resource].findById(req.params[0], {
        attributes: {
          exclude: excludedFields
        }
      }).then(location => {
        if (!location) {
          return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                              Err.NOT_FOUND);
        }
        res.status(200).json(response.generate(location));
      }).catch(() => {
        Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND, Err.NOT_FOUND);
      });
    } else {
      models[resource].findAll({
        attributes: {
          exclude: excludedFields
        }
      }).then(locations => {
        res.status(200).json(response.generate(locations));
      });
    }
  }).catch(() => {
    Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
  });
});

// XXX  [Location router] Implement associations to other models and integrity

router.post('/', (req, res) => {
  db().then((models) => {
    models[resource].create(req.body)
    .then(location => {
      // XXX #13 Response urls should be absolute
      res.location('/' + resource + '(' + location.id + ')');
      res.status(201).send(response.generate(location));
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
    models.updateInstance(resource, id, req.body, excludedFields)
    .then(location => {
      res.location('/' + resource + '(' + id + ')');
      res.status(200).json(response.generate(location));
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
    models[resource].destroy({
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
