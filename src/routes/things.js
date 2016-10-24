import express    from 'express';
import db         from '../models/db';
import response   from '../response';
import {
  ApiError,
  ERRNO_INTERNAL_ERROR,
  ERRNO_RESOURCE_NOT_FOUND,
  ERRNO_BAD_REQUEST,
  INTERNAL_ERROR,
  NOT_FOUND,
  BAD_REQUEST
} from '../errors';

let router = express.Router({ mergeParams: true });
const excludedFields = ['createdAt', 'updatedAt'];

/**
 * Implementation of 8.3.1 "Thing"
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
 * http://example.org/v1.0/Things
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
 *    "@iot.nextLink":"http://example.org/v1.0/ObservedProperties?$top=5&$skip=5"
 * }
 **/

const resource = 'Things';

router.get('/', (req, res) => {
  db().then(models => {
    if (req.params && req.params[0]) {
      models.Things.findById(req.params[0], {
        attributes: {
          exclude: excludedFields
        }
      }).then(thing => {
        if (!thing) {
          return ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
        }
        res.status(200).json(response.generate(thing));
      }).catch(() => {
        ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
      });
    } else {
      models.Things.findAll({
        attributes: {
          exclude: excludedFields
        }
      }).then(things => {
        res.status(200).json(response.generate(things));
      });
    }
  }).catch(() => {
    ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
  });
});

// XXX #9 [Things router] Implement associations to other models and integrity

router.post('/', (req, res) => {
  db().then(models => {
    models.Things.create(req.body).then(createdThing => {
      // XXX #13 [Things router] response urls should be absolute
      res.location('/' + resource + '/' + createdThing.id);
      res.status(201).send();
    }).catch(() => {
      ApiError(res, 400, ERRNO_BAD_REQUEST, BAD_REQUEST);
    });
  }).catch(() => {
    ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
  });
});

// XXX #11 [Things router] Check that entity does not contain related entities
// as inline content in PATCH requests
// XXX #12 [Things router] Handle navigation properties in PATCH requests

router.patch('/', (req, res) => {
  if (!req.params || !req.params[0]) {
    return ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
  }

  db().then(models => {
    Reflect.deleteProperty(req.body, 'id');
    models.updateInstance('Things', req.params[0], req.body, excludedFields)
    .then(updatedThing => {
      res.status(200).json(response.generate(updatedThing));
    }).catch((err) => {
      err.type = err.type || INTERNAL_ERROR;
      switch (err.type) {
        case NOT_FOUND:
          return ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
        case INTERNAL_ERROR:
        default:
          return ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
      }
    });
  }).catch(() => {
    ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
  });
});

router.delete('/', (req, res) => {
  if (!req.params || !req.params[0]) {
    return ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
  }

  db().then(models => {
    models.Things.destroy({
      where: { id: req.params[0] }
    }).then(() => {
      res.status(204).send();
    }).catch(() => {
      ApiError(res, 404, ERRNO_RESOURCE_NOT_FOUND, NOT_FOUND);
    });
  }).catch(() => {
    ApiError(res, 500, ERRNO_INTERNAL_ERROR, INTERNAL_ERROR);
  });
});

module.exports = router;
