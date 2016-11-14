import db         from '../models/db';
import express    from 'express';
import response   from '../response';

import * as ERR   from '../errors';
import * as CONST from '../constants';

module.exports = function resource(endpoint, exclude, associations = []) {

  let router = express.Router({ mergeParams: true });

  router.get('', (req, res) => {
    db().then(models => {
      if (req.params && req.params[0]) {
        models[endpoint].findById(req.params[0], {
          attributes: { exclude }
        }).then(instance => {
          if (!instance) {
            return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                ERR.NOT_FOUND);
          }
          res.status(200).send(response.generate(instance, associations));
        });
      } else {
        models[endpoint].findAll({
          attributes: { exclude }
        }).then(instances => {
          res.status(200).send(response.generate(instances, associations));
        });
      }
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.post('/', (req, res) => {
    db().then(models => {
      createAssociations(models, req).then(instance => {
        // XXX #13 Response urls should be absolute
        res.location('/' + endpoint + '(' + instance.id + ')');
        res.status(201).send(response.generate(instance, associations));
      }).catch(err => {
        switch (err.name) {
          case ERR.modelErrors[ERR.VALIDATION_ERROR]:
            ERR.ApiError(res, 400, ERR.ERRNO_VALIDATION_ERROR, ERR.BAD_REQUEST,
                       JSON.stringify(err.errors));
            break;
          default:
            ERR.ApiError(res, 400, ERR.ERRNO_BAD_REQUEST, ERR.BAD_REQUEST,
                       JSON.stringify(err.errors));
        }
      });
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  });

  router.patch('', (req, res) => {
    const id = req.params && req.params[0];
    if (!id) {
      return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                          ERR.NOT_FOUND);
    }

    db().then(models => {
      Reflect.deleteProperty(req.body, 'id');
      models.updateInstance(endpoint, id, req.body, exclude)
      .then(instance => {
        res.location('/' + endpoint + '(' + id + ')');
        res.status(200).json(response.generate(instance, associations));
      }).catch(err => {
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
            ERR.ApiError(res, 400, ERR.ERRNO_BAD_REQUEST, ERR.BAD_REQUEST,
                       JSON.stringify(err.errors));
        }
      });
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
      models[endpoint].destroy({
        where: { id: req.params[0] }
      }).then(count => {
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

  // Transaction method that links all the associated models in the body
  // for an specific model. It returns a promise that resolves with the linked
  // instance
  const createAssociations = (models, req) => {
    return models.sequelize.transaction(transaction => {
      return models[endpoint].create(req.body, {
        transaction
      }).then(instance => {
        // #62: Use the associations coming from the model in the whole
        // router. We won't need to define it here then.
        const relations = models[endpoint].associations;
        if (Object.keys(relations).length <= 0) {
          // Nothing to link
          return Promise.resolve(instance);
        }

        let promises = [];
        Object.keys(relations).forEach(associationName => {
          const body = req.body[associationName];
          if (!body) {
            return;
          }

          const pluralName = relations[associationName].options.name.plural;
          const model = models[associationName] || models[pluralName];
          const association = relations[associationName];
          const link = createAssociation(instance, model, association, body,
                                         transaction);
          promises.push(link);
        });

        return Promise.all(promises).then(() => instance);
      });
    });
  };

  // Finds or creates an specific entity, and associates it to the given
  // instance.
  const createAssociation = (instance, model, association, entity,
                             transaction) => {
    const singularName = model.options.name.singular;
    const id = entity[CONST.iotId];
    const attributes = Object.keys(entity);

    if (attributes.length > 1) {
      // According to section 10.2.1.2, if any parameter other than '@iot.id' is
      // sent in a linked entity (even if it also includes @iot.id), we need to
      // create a new instance of the associated entity.
      Reflect.deleteProperty(entity, 'id');
      return instance['create' + singularName](entity, { transaction });
    }

    // According to section 10.2.1.1, if the only parameter of a linked entity
    // in the body is '@iot.id', we need to associate that instance to the one
    // that is being created.
    return model.findById(id, { transaction }).then(found => {
      if (!found) {
        return Promise.reject({
          name: ERR.modelErrors[ERR.VALIDATION_ERROR]
        });
      }
      switch (association.associationType) {
        case CONST.hasMany:
        case CONST.belongsToMany:
          // XXX Issue #61 Allow arrays on hasMany, belongsToMany associations
          return instance['add' + singularName](found, { transaction });
        case CONST.hasOne:
        case CONST.belongsTo:
          return instance['set' + singularName](found, { transaction });
        default:
          return Promise.reject({ name: ERR.INTERNAL_ERROR });
      }
    });
  }

  return router;
};
