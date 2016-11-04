import express    from 'express';
import db         from '../models/db';
import response   from '../response';
import * as Err   from '../errors';

module.exports = function resource (endpoint, excludedFields, associations) {
  let router = express.Router({ mergeParams: true });

  router.get('', (req, res) => {
    db().then(models => {
      if (req.params && req.params[0]) {
        models[endpoint].findById(req.params[0], {
          attributes: {
            exclude: excludedFields
          }
        }).then(instance => {
          if (!instance) {
            return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                                Err.NOT_FOUND);
          }
          res.status(200).send(response.generate(instance, associations));
        });
      } else {
        models[endpoint].findAll({
          attributes: {
            exclude: excludedFields
          }
        }).then(instances => {
          res.status(200).send(response.generate(instances, associations));
        });
      }
    }).catch(() => {
      Err.ApiError(res, 500, Err.ERRNO_INTERNAL_ERROR, Err.INTERNAL_ERROR);
    });
  });

  router.post('/', (req, res) => {
    db().then(models => {
      models[endpoint].create(req.body).then(instance => {
        // XXX #13 Response urls should be absolute
        res.location('/' + endpoint + '(' + instance.id + ')');
        res.status(201).send(response.generate(instance, associations));
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
      return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                          Err.NOT_FOUND);
    }

    db().then(models => {
      Reflect.deleteProperty(req.body, 'id');
      models.updateInstance(endpoint, id, req.body, excludedFields)
      .then(instance => {
        res.location('/' + endpoint + '(' + id + ')');
        res.status(200).json(response.generate(instance, associations));
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
      return Err.ApiError(res, 404, Err.ERRNO_RESOURCE_NOT_FOUND,
                          Err.NOT_FOUND);
    }

    db().then(models => {
      models[endpoint].destroy({
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

  return router;
};
