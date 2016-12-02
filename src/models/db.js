/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import Association      from './association';
import fs               from 'fs';
import path             from 'path';
import Sequelize        from 'sequelize';

import {
  integrityConstrains,
  iotId
} from '../constants';

import {
  BAD_REQUEST,
  ERRNO_INLINE_CONTENT_NOT_ALLOWED,
  ERRNO_INVALID_ASSOCIATION,
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

export default config => {
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
      return (file.indexOf('.js') !== 0 &&
              file !== 'association.js');
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
        return Association.maybeCreate(transaction, instance,
                                       req, exclude);
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
                Association.applyAssociation(transaction, instance,
                                             association.target,
                                             association, id, id,
                                             exclude)
              );
            });
          });

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
