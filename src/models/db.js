/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import fs        from 'fs';
import path      from 'path';
import Sequelize from 'sequelize';

import {
  belongsTo,
  belongsToMany,
  hasMany,
  hasOne,
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

  const { name, user, pass, host, port } = config;

  const sequelize = new Sequelize(name, user, pass, {
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

  const isMultipleAssociation = type => {
    return [hasMany, belongsToMany].indexOf(type) > -1;
  };

  const applyAssociation = (transaction, model, associationType,
                            associationName, id, instance, primaryKey) => {
    return model.findById(id, { transaction }).then(found => {
      if (!found) {
        return Promise.reject({
          name: BAD_REQUEST,
          errno: ERRNO_INVALID_ASSOCIATION,
          errors: 'Invalid association. ' +
                  model.options.name.singular + ' with id ' + id + ' not found'
        });
      }
      switch (associationType) {
        case hasMany:
        case belongsToMany:
          return instance['add' + associationName](primaryKey || found,
                                                   { transaction });
        case hasOne:
        case belongsTo:
          return instance['set' + associationName](primaryKey || found,
                                                   { transaction });
        default:
          return Promise.reject({ name: INTERNAL_ERROR });
      }
    });
  };

  // Finds an specific entity, and associates it to the given instance.
  const createAssociation = (instance, model, association, entity,
                             transaction) => {
    const singularName = model.options.name.singular;
    const id = entity[iotId];
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
    return applyAssociation(transaction, model, association.associationType,
                            singularName, id, instance);
  }

  // Transaction method that links all the associated models in the body
  // for an specific model. It returns a promise that resolves with the linked
  // instance
  db.createInstance = (modelName, entity) => {
    return db.sequelize.transaction(transaction => {
      return db[modelName].create(entity, {
        transaction
      }).then(instance => {
        // #62: Use the associations coming from the model in the whole
        // router. We won't need to define it here then.
        const relations = db[modelName].associations;
        if (Object.keys(relations).length <= 0) {
          // Nothing to link
          return Promise.resolve(instance);
        }

        let promises = [];
        try {
          Object.keys(relations).forEach(associationName => {
            const association = relations[associationName];
            const body = entity[associationName];
            if (!body) {
              return;
            }

            const isList = Array.isArray(body);

            if (isList && !isMultipleAssociation(association.associationType)) {
              throw Object.create({
                name: BAD_REQUEST,
                errno: ERRNO_INVALID_ASSOCIATION,
                errors: 'Cannot use arrays for this association type'
              });
            }

            const relatedEntities = isList ? body : [body];
            const pluralName = association.options.name.plural;
            const model = db[associationName] || db[pluralName];

            relatedEntities.forEach(relatedEntity => {
              promises.push(createAssociation(instance, model, association,
                                              relatedEntity, transaction));
            });
          });
        } catch(error) {
          return Promise.reject(error);
        }

        return Promise.all(promises).then(() => instance);
      });
    });
  };

  // Updates an specific model instance and returns the updated object.
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

              if (isList &&
                  !isMultipleAssociation(association.associationType)) {
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
                  applyAssociation(transaction, association.target,
                                   association.associationType,
                                   association.options.name.singular,
                                   id, instance, id)
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
  });
};
