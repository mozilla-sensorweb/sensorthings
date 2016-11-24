import db           from '../models/db';
import express      from 'express';
import response     from '../response';
import { entities } from '../constants';

import * as ERR   from '../errors';

module.exports = function resource(endpoint, exclude, version) {
  const associations = models => {
    return Object.keys(models[endpoint].associations);
  };

  const handleModelError = res => {
    return err => {
      switch (err.name) {
        case ERR.modelErrors[ERR.VALIDATION_ERROR]:
          ERR.ApiError(res, 400, ERR.ERRNO_VALIDATION_ERROR, ERR.BAD_REQUEST,
                       JSON.stringify(err.errors));
          break;
        case ERR.NOT_FOUND:
          ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND, ERR.NOT_FOUND,
                       JSON.stringify(err.errors));
          break;
        default:
          ERR.ApiError(res, 400, err.errno || ERR.ERRNO_BAD_REQUEST,
                       ERR.BAD_REQUEST, JSON.stringify(err.errors));
      }
    };
  };

  let router = express.Router({ mergeParams: true });

  router.get('', (req, res) => {
    const prepath = req.protocol + '://' + req.hostname + ':' +
                    req.socket.localPort + '/' + version + '/';
    db().then(models => {
      if (req.params && req.params[0]) {
        const property = req.params[1];
        let attributes = { exclude };
        if (property) {
          attributes.include = [ property ];
        }

        models[endpoint].findById(req.params[0], {
          attributes
        }).then(instance => {
          if (!instance) {
            return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                ERR.NOT_FOUND);
          }

          if (property) {
            // If the value of the property is null, it should respond 204
            if (!instance[property]) {
              return res.status(204).send();
            }

            let body = {};
            const value = req.params[2];
            if (value === '$value') {
              // 9.2.5 Usage 5: address to the value of an entity’s property.
              body = instance[property];
            } else if (value === '$ref') {
              // 9.2.7 Usage 7: address to an associationLink
              // XXX Issue #54
            } else {
              // 9.2.4 Usage 4: address to a property of an entity.
              body[property] = instance[property];
            }
            return res.status(200).json(body);
          }

          const associationModels = associations(models);
          res.status(200).send(response.generate(instance, associationModels,
                                                 prepath, exclude));
        }).catch(() => {
          return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                ERR.NOT_FOUND);
        });
      } else {
        let include;
        const lastResource = req.lastResource;
        if (lastResource) {
          // lastResource is an object of this form:
          // {
          //   model <Sequelize Model>,
          //   id: <String>
          // }
          //
          // If it is set, we need to query the database to obtain all the
          // instances of the `endpoint` model that are associated to the
          // entity defined by lastResource.
          //
          // For ex. in a request like
          // http://localhost:8080/v1.0/Things(1)/Locations
          // lastResource would be
          // {
          //   model: Things,
          //   id: 1
          // }
          //
          // So we would need to get all Locations associated to the Thing with
          // id 1.
          //
          include = [{
            model: lastResource.model,
            where: { id: lastResource.id }
          }];
          exclude = exclude.concat([lastResource.model.options.name.plural]);
        }

        // Here we are implementing two resource path handlers:
        // 1. If no lastResource is set, we implement 9.2.2 Usage 2: address to
        //    a collection of entities. For ex.
        //    http://example.org/v1.0/ObservedProperties
        // 2. If lastResource is set, we implement 9.2.6 Usage 6: address to a
        //    navigation property (navigationLink). For ex.
        //    http://example.org/v1.0/Datastreams(1)/Observations
        models[endpoint].findAll({
          attributes: { exclude },
          include
        }).then(instances => {
          const singularName = entities[endpoint];
          const associationModels = associations(models);
          if (lastResource && lastResource.model.associations[singularName]) {
            // If the association with the singular name exists, it means
            // that is a single association
            return res.status(200).send(response.generate(instances[0],
                                                          associationModels,
                                                          prepath,
                                                          exclude));
          }

          res.status(200).send(response.generate(instances, associationModels,
                                                 prepath, exclude));
        });
      }
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.post('/', (req, res) => {
    const prepath = req.protocol + '://' + req.hostname + ':' +
                    req.socket.localPort + '/' + version + '/';
    db().then(models => {
      models.createInstance(endpoint, req.body, exclude).then(instance => {
        res.location(prepath + endpoint + '(' + instance.id + ')');
        res.status(201).send(response.generate(instance, associations(models),
                                               prepath, exclude));
      }).catch(handleModelError(res));
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.patch('', (req, res) => {
    const prepath = req.protocol + '://' + req.hostname + ':' +
                    req.socket.localPort + '/' + version + '/';
    const id = req.params && req.params[0];
    if (!id) {
      return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                          ERR.NOT_FOUND);
    }

    db().then(models => {
      Reflect.deleteProperty(req.body, 'id');
      models.updateInstance(endpoint, id, req.body, exclude)
      .then(instance => {
        res.location(prepath + endpoint + '(' + id + ')');
        res.status(200).json(response.generate(instance, associations(models),
                                               prepath, exclude));
      }).catch(handleModelError(res));
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.delete('', (req, res) => {
    if (!req.params || !req.params[0]) {
      return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                          ERR.NOT_FOUND);
    }

    db().then(models => {
      models.deleteInstance(models[endpoint], req.params[0]).then(count => {
        if (!count) {
          return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                              ERR.NOT_FOUND);
        }
        res.status(204).send();
      });
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  return router;
};
