/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import Association      from './association';
import fs               from 'fs';
import path             from 'path';
import Sequelize        from 'sequelize';

import {
  entities,
  integrityConstrains,
  iotId,
  limit,
  modelNames
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
              file !== 'association.js' &&
              file !== 'db.js');
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

  const getById = (modelName, req, queryOptions) => {
    // req.params[1] may contain a property name.
    //
    // For example, for a URL like /v1.0/Things(1)/name, req.params[1]
    // would be 'name'.
    const property = req.params[1];
    if (property) {
      queryOptions.attributes.include = [ property ];
    }

    return db[modelName].findById(req.params[0], queryOptions)
    .then(instance => {
      if (!instance) {
        return Promise.reject({
          name: NOT_FOUND,
        });
      }

      const options = {
        exclude: queryOptions.attributes.exclude,
        expand: req.odata && req.odata.$expand,
        ref: req.params[3],
        select: req.odata && req.odata.$select
      };

      if (property) {
        // If the value of the property is null, it should respond 204
        if (!instance[property]) {
          return Promise.resolve({
            code: 204
          });
        }

        let body;
        const value = req.params[2];
        if (value === '$value') {
          // 9.2.5 Usage 5: address to the value of an entity’s property.
          body = instance[property];
        } else {
          // 9.2.4 Usage 4: address to a property of an entity.
          body = {};
          body[property] = instance[property];
        }
        return Promise.resolve({
          code: 200,
          body,
          options
        });
      }

      return Promise.resolve({
        code: 200,
        instance,
        options
      });
    }).catch(() => {
      return Promise.reject({
        name: NOT_FOUND
      });
    });
  };

  const get = (modelName, req, queryOptions) => {
    const lastResource = req.lastResource;
    if (lastResource) {
      // lastResource is an object of this form:
      // {
      //   model <Sequelize Model>,
      //   id: <String>
      // }
      //
      // If it is set, we need to query the database to obtain all the
      // instances of the `modelName` model that are associated to the
      // entity defined by lastResource.
      //
      // For ex. on a request like
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

      const expanded = queryOptions.include.some(include => {
        return include.model === lastResource.model;
      });

      if (!expanded) {
        queryOptions.include.push({
          model: lastResource.model,
          where: { id: lastResource.id }
        });

        let excluded = queryOptions.attributes.exclude;
        queryOptions.attributes.exclude = excluded.concat([
          lastResource.model.options.name.plural
        ]);
      }
    }

    const options = {
      count: req.odata && req.odata.$count,
      exclude: queryOptions.attributes.exclude,
      expand: req.odata && req.odata.$expand,
      ref: req.params[3],
      select: req.odata && req.odata.$select,
      skip: queryOptions.offset,
      top: queryOptions.limit
    };

    return db[modelName].findAndCountAll(queryOptions).then(result => {
      const singularName = entities[modelName];
      let instance = result.rows;
      if (lastResource && lastResource.model.associations[singularName]) {
        // If the association with the singular name exists, it means
        // that is a single association.
        instance = result.rows[0];
      }
      options.totalCount = result.count;
      return Promise.resolve({
        code: 200,
        instance,
        options
      });
    });
  };

  db.getInstance = (modelName, req, exclude) => {
    return db.sequelize.transaction(transaction => {
      // By default we set a limit of 100 entities max.
      const top = req.odata && req.odata.$top && req.odata.$top < limit ?
                  req.odata.$top : limit;
      const skip = req.odata && req.odata.$skip;
      const orderBy = (req.odata && req.odata.$orderby) || [];
      const expand = req.odata && req.odata.$expand;
      const filter = req.odata && req.odata.$filter;

      let queryOptions = {
        transaction,
        limit: top,
        offset: skip,
        order: orderBy.map(field => {
          const key = Object.keys(field)[0];
          return [key, field[key].toUpperCase()];
        }),
        attributes: { exclude },
        include: [],
        where: {}
      };

      // The $expand system query option indicates the related entities to be
      // represented inline. The value of the $expand query option SHALL be a
      // comma separated list of navigation property names. Additionally, each
      // navigation property can be followed by a forward slash and another
      // navigation property to enable identifying a multi-level relationship.
      if (expand) {
        queryOptions.include = getInclude(req.normalizedExpand);
        // When expanding, we need to remove from the excluded attributes
        // the expanded models and ids, otherwise won't be shown
        const filterExclude = queryOptions.attributes.exclude.filter(att => {
          return expand.every(m => {
            m = m.split('/')[0];
            const avoidFilter = [m, m + 'Id', entities[m], entities[m] + 'Id'];
            return avoidFilter.indexOf(att) === -1;
          });
        });
        queryOptions.attributes.exclude = filterExclude;
      }

      if (filter) {
        Object.assign(queryOptions.where, filter);
      }

      // req.params[0] may contain the id of the final resource from a URL of
      // this form.
      //
      // '[/:Resource(n)]n times/FinalResource(id)?/property?/($value | $ref)?
      //
      // For example, for a URL like /v1.0/Things(1)/Locations(2),
      // req.params[0] would be 2.
      const id = req.params && req.params[0];

      if (id) {
        // If the id is present in the request, we may be handling one of these
        // two resource paths:
        // * 9.2.5 Usage 5: address to the value of an entity’s property.
        // * 9.2.4 Usage 4: address to a property of an entity.
        return getById(modelName, req, queryOptions);
      }

      // Otherwise, we may be handling one of three possible resource paths:
      // 1. If no lastResource is set, we implement 9.2.2 Usage 2: address to
      //    a collection of entities. For ex.
      //    http://example.org/v1.0/ObservedProperties
      // 2. If lastResource is set, we implement:
      //    * 9.2.6 Usage 6: address to a navigation prop (navigationLink)
      //    For ex. http://example.org/v1.0/Datastreams(1)/Observations
      //    * 9.2.7 Usage 7: address to an associationLink
      //    For ex. http://example.org/v1.0/Datastreams(1)/Observations/$ref
      return get(modelName, req, queryOptions);
    });
  };

  // Given a normalized expand object, it creates a include object that
  // Sequelize can understand.
  const getInclude = (expand) => {
    if (!expand) {
      return;
    }

    let result = [];
    Object.keys(expand).forEach(model => {
      result.push({
        model: db[modelNames[model]],
        include: getInclude(expand[model])
      })
    });
    return result;
  }

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
    const constrains = integrityConstrains[db.getPlural(model.options)] || [];
    // We start from the bottom, removing the entities associated to the
    // instance to be deleted as enforced by the integrity constrains
    // defined on the Table 25 from 10.4 Delete an entity
    // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#68
    let promises = [];
    Object.keys(model.associations).forEach(key => {
      const association = model.associations[key];
      if (constrains.indexOf(db.getPlural(association.options)) > -1) {
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
