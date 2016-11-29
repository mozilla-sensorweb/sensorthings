/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import fs        from 'fs';
import path      from 'path';
import Sequelize from 'sequelize';

import {
  entities,
  integrityConstrains,
  iotId
} from '../constants';

import {
  BAD_REQUEST,
  ERRNO_INLINE_CONTENT_NOT_ALLOWED,
  ERRNO_INVALID_ASSOCIATION,
  INTERNAL_ERROR,
  NOT_FOUND
} from '../errors';

const IDLE           = 0
const INITIALIZING   = 1;
const READY          = 2;

const Deferred = function Deferred () {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });

  return this;
};

let deferreds = [];

let state = IDLE;
let db    = null;

module.exports = config => {
  if (state === READY) {
    return Promise.resolve(db);
  }

  let deferred = new Deferred();
  deferreds.push(deferred);

  if (state === INITIALIZING) {
    return deferred.promise;
  }

  state = INITIALIZING;

  const { name, user, password, host, port } = config;

  const sequelize = new Sequelize(name, user, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false
  });

  db = {};

  fs.readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.js') !== 0);
    })
    .forEach(file => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  db.getPlural = modelOptions => {
    let modelName = modelOptions.name.plural;
    return modelName;
  }

  const applyAssociation = (transaction, instance,
                            modelToAssociateWith,
                            association,
                            associatedEntityId,
                            associatedEntityIdOverride,
                            exclude) => {
    return modelToAssociateWith.findById(associatedEntityId, {
      attributes: { exclude },
      transaction
    }).then(found => {
      if (!found) {
        return Promise.reject({
          name: BAD_REQUEST,
          errno: ERRNO_INVALID_ASSOCIATION,
          errors: 'Invalid association. ' +
                  modelToAssociateWith.options.name.singular + ' with id ' +
                  associatedEntityId + ' not found'
        });
      }

      if (association.isMultiAssociation) {
        return instance[association.accessors.add](
          associatedEntityIdOverride || found,
          { transaction }
        );
      }
      return instance[association.accessors.set](
        associatedEntityIdOverride || found,
        { transaction }
      );
    });
  };

  /*
   * Finds or creates an specific entity and associates it to the
   * given instance.
   */
  const createAssociation = (transaction, instance,
                             modelToAssociateWith,
                             association,
                             associatedEntity, exclude) => {
    const associatedEntityId = associatedEntity[iotId];
    const attributes = Object.keys(associatedEntity);

    if (attributes.length === 1 && associatedEntityId) {
      // According to section 10.2.1.1, if the only parameter of a linked entity
      // in the body is '@iot.id', we need to associate that entity to the
      // recently created instance.
      return applyAssociation(transaction, instance,
                              modelToAssociateWith,
                              association,
                              associatedEntityId,
                              undefined,
                              exclude);
    }

    // According to section 10.2.1.2, if any parameter other than '@iot.id' is
    // sent in a linked entity (even if it also includes @iot.id), we need to
    // create a new instance of the associated entity.
    Reflect.deleteProperty(associatedEntity, 'id');
    return instance[association.accessors.create](
      associatedEntity, { transaction }
    ).then(function onAssociationCreated() {
      // The Promise here resolves with `instance` which is not the associated
      // instance that we just created and that we need to continue looking
      // for deeper associations.
      const associatedInstance = this;
      if (!associatedInstance) {
        return Promise.reject({
          name: BAD_REQUEST,
          errno: ERRNO_INVALID_ASSOCIATION,
          errors: 'Could not create entity with body ' + associatedEntity
        });
      }
      // There may be other entities to be associated inside the
      // recently created entity. This is what we call "deep insert".
      //
      // For example, we may have a request like
      //
      // POST /v1.0/ModelA
      // {
      //   modelAproperty: 'whatever',
      //   ModelB: {
      //     modelBproperty: 'whatever'
      //     ModelC: {
      //       '@iot.id': 1
      //     }
      //   }
      // }
      //
      // In this case, after creating the instance of ModelB, we need
      // to process the body of ModelB to see if there are related entites
      // in it, like modelC.
      return maybeCreateAssociation(transaction, associatedInstance,
                                    { body: associatedEntity }, exclude);
    });
  }

  /*
   * Method to check if the recently created instance needs to be associated
   * with any other entity.
   * An association can happen because:
   *
   * - The URL is like /v1.0/Things(1)/Locations, where the recently created
   *   instance is Location and Things(1) is the entity to be associated to
   *   Location. In this case, req.lastResource will contain:
   *   { model: Things, id: 1 }
   *
   * - The request body contains inline entities or references to existing
   *   entities. For example:
   *
   * {
   *   property1: 'property1',
   *   Entity: {
   *     property2: 'property2'
   *   }
   * }
   *
   * {
   *   property1: 'property1',
   *   Entity: {
   *     '@iot.id': 1
   *   }
   * }
   *
   * In case that there are inline entities, these entities will need to be
   * created before applying the association.
   *
   * In case that there are references to existing entities, we need to check
   * that the referenced entity actually exist before applying the association.
   *
   */
  const maybeCreateAssociation = (transaction, instance, req, exclude) => {
    const modelName = instance.$modelOptions.name.plural;
    // relations holds the list of all possible relations for the recently
    // created entity (instance).
    const relations = db[modelName].associations;
    if (Object.keys(relations).length <= 0) {
      // Nothing to link
      return Promise.resolve(instance);
    }

    let promises = [];

    // Create associations defined in the url.
    //
    // req.lastResource contains the model and id of the previous resource
    // defined in the url if any exists. So for example, for a request
    // with URL Things(1)/Locations, lastResource contains model 'Things'
    // and id 1. In this case we need to associate the recently created
    // Locations (instance variable) to the Thing with id 1.
    const lastResource = req.lastResource;
    if (lastResource) {
      if (!lastResource.model || !lastResource.id) {
        return Promise.reject({
          name: INTERNAL_ERROR,
          message: 'Malformed lastResource'
        });
      }

      // The spec does not specifically mention this, but in order to avoid
      // confussion, we forbid the case where an association is done in both
      // the URL and the request body. So for example, a request like this is
      // not valid.
      //
      // POST v1.0/Things(1)/Locations
      // {
      //   Thing: {
      //     '@iot.id': 1
      //   }
      // }
      //
      // XXX if (req.body[]) { }

      const modelToAssociateWith = lastResource.model;
      const association = relations[lastResource.associationName] ||
                          relations[entities[lastResource.associationName]];
      promises.push(createAssociation(transaction, instance,
                                      modelToAssociateWith,
                                      association,
                                      { '@iot.id': lastResource.id },
                                      exclude));
    }

    // Create associations defined in the request body.
    //
    // The request body may also contain associated entities defined inline or
    // referencing a previously created entity by its id.
    //
    // For example.
    //
    // POST /Observations
    // {
    //   "Datastream": {
    //     "@iot.id": 1
    //   },
    //   "phenomenonTime": “2013-04-18T16:15:00-07:00",
    //   "result": 124,
    //   "FeatureOfInterest": {
    //     "@iot.id": 2
    //     }
    //   }
    // }
    //
    // In this case, at this point we have already created the Observation
    // with the given phenomenonTime and result. Now we need to associate
    // to it the existing Datastream with id 1 and the existing
    // FeaturesOfInterest with id 2, if they really exist.
    //
    try {
      Object.keys(relations).forEach(associationName => {
        const association = relations[associationName];
        const body = req.body[associationName];
        // For each possible association we check if the request body contains
        // any reference to the association model.
        if (!body) {
          return;
        }

        const isList = Array.isArray(body);

        if (isList && !association.isMultiAssociation) {
          throw Object.create({
            name: BAD_REQUEST,
            errno: ERRNO_INVALID_ASSOCIATION,
            errors: 'Cannot use arrays for this association type'
          });
        }

        const associatedEntities = isList ? body : [body];
        const pluralName = association.options.name.plural;
        const modelToAssociateWith = db[associationName] || db[pluralName];

        associatedEntities.forEach(associatedEntity => {
          promises.push(createAssociation(transaction, instance,
                                          modelToAssociateWith,
                                          association,
                                          associatedEntity,
                                          exclude));
        });
      });
    } catch(error) {
      return Promise.reject(error);
    }

    return Promise.all(promises).then(() => instance);
  }

  /*
   * Transaction method that links all the associated models in the body
   * for an specific model. It returns a promise that resolves with the
   * linked instance.
   */
  db.createInstance = (modelName, req, exclude) => {
    return db.sequelize.transaction(transaction => {
      return db[modelName].create(req.body, {
        transaction
      }).then(instance => {
        return maybeCreateAssociation(transaction, instance, req, exclude);
      });
    });
  };

  /*
   * Updates an specific model instance and returns the updated object.
   */
  db.updateInstance = (model, instanceId, values, exclude) => {
    return db.sequelize.transaction(transaction => {
      return db[model].update(values, {
        where: { id: instanceId }
      }, { transaction }).then(affected => {
        const affectedRows = affected[0];
        if (affectedRows !== 1) {
          return Promise.reject({
            name: NOT_FOUND
          });
        }
        return db[model].findById(instanceId, {
          attributes: { exclude },
          transaction
        }).then(instance => {
          const associations = db[model].associations;
          if (Object.keys(associations).length <= 0) {
            // There are no associations for this model, so we can simply
            // return the instance of the updated model here.
            return Promise.resolve(instance);
          }

          // If there are associations for this model, we need to check if
          // there are new values for these associations and in that case,
          // update the associations as well before returning the updated
          // instance.
          let promises = [];
          try {
            Object.keys(associations).forEach(associationName => {
              const association = associations[associationName];
              const associationBody = values[associationName];
              // There is no entry for this association in the request body, so
              // we just try with the next one.
              if (!associationBody) {
                return;
              }

              const isList = Array.isArray(associationBody);

              if (isList && !association.isMultiAssociation) {
                throw Object.create({
                  name: BAD_REQUEST,
                  errno: ERRNO_INVALID_ASSOCIATION,
                  errors: 'Cannot use arrays for this association type'
                });
              }

              const associationBodies =
                isList ? associationBody : [associationBody];
              associationBodies.forEach(body => {
                const id = body[iotId];

                // The entity SHALL NOT contain related entities as inline
                // content. It MAY contain only binding information for
                // navigation properties. So we only allow the @iot.id field.
                if (Object.keys(body).length !== 1 ||
                    typeof(id) === 'undefined') {
                  throw Object.create({
                    name: BAD_REQUEST,
                    errno: ERRNO_INLINE_CONTENT_NOT_ALLOWED,
                    errors: 'Inline content is not allowed for PATCH requests'
                  });
                }

                promises.push(
                  applyAssociation(transaction,
                                   instance,
                                   association.target,
                                   association,
                                   id, id,
                                   exclude)
                );
              });
            });
          } catch(error) {
            return Promise.reject(error);
          }

          // We don't need to get the instance again after updating the
          // associations, as navigation links do not include any association
          // id (i.e.
          // Thing@iot.navigationLink:
          //   HistoricalLocations(9669948)/Thing or
          // Locations@iot.navigationLink:
          //   HistoricalLocations(9669948)/Locations
          // )
          return Promise.all(promises).then(() => instance);
        });
      });
    });
  };

  const deleteInstance = (transaction, model, id) => {
    const constrain = integrityConstrains[db.getPlural(model.options)];
    // We start from the bottom, removing the entities associated to the
    // instance to be deleted as enforced by the integrity constrains
    // defined on the Table 25 from 10.4 Delete an entity
    // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#68
    let promises = [];
    Object.keys(model.associations).forEach(key => {
      const association = model.associations[key];
      if (constrain && db.getPlural(association.options) === constrain) {
        promises.push(association.target.findAll({
          include: [{
            model,
            where: { id }
          }]
        }).then(results => {
          if (!results || !results.length) {
            return Promise.resolve();
          }
          let morePromises = [];
          results.forEach(result => {
            morePromises.push(
              deleteInstance(transaction, association.target, result.id)
            );
          });
          return Promise.all(morePromises);
        }));
      }
    });
    return Promise.all(promises).then(() => {
      return model.destroy({ where: { id } });
    });
  };

  db.deleteInstance = (model, id) => {
    return db.sequelize.transaction(transaction => {
      return deleteInstance(transaction, model, id);
    });
  };

  return db.sequelize.sync().then(() => {
    while (deferreds.length) {
      deferreds.pop().resolve(db);
    }
    state = READY;

    return db;
  }).catch(err => {
    while (deferreds.length) {
      deferreds.pop().reject(err);
    }
    throw err;
  });
};
