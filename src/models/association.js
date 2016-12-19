/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import db from './db';

import { getModelName } from '../utils';

import {
  datastreams,
  entities,
  featureOfInterest,
  featuresOfInterest,
  iotId,
  locations,
  observedProperties,
  sensors,
  things
} from '../constants';

import {
  BAD_REQUEST,
  ERRNO_BAD_REQUEST,
  ERRNO_INVALID_ASSOCIATION,
  ERRNO_MANDATORY_ASSOCIATION_MISSING,
  INTERNAL_ERROR
} from '../errors';


/*
 * Converts a Location into a FeatureOfInterest
 */
const featureOfInterestFromLocation = location => {
  if (!location) {
    return null;
  }

  const feature = Object.assign({}, {
    name: location.name,
    description: location.description,
    encodingType: location.encodingType
  });

  feature.feature = Object.assign({}, location.location);
  Reflect.deleteProperty(feature, 'location');
  return feature;
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

    let accessor = association.isMultiAssociation ? 'add' : 'set';

    return instance[association.accessors[accessor]](
      associatedEntityIdOverride || found,
      { transaction }
    ).then(result => {
      if (!association.afterAssociation) {
        return result;
      }

      // Sequelize does not allow hooks for associations related actions,
      // so we allow models to define an 'afterAssociation' function that
      // will be called after applying an association.
      // This is used for example by Things and Locations models, to create
      // HistoricalLocations entities as required by the spec:
      //   "When a Thing has a new Location, a new HistoricalLocation SHALL
      //    be created and added to the Thing automatically by the service.
      //    The current Location of the Thing SHALL only be added to
      //    HistoricalLocation automatically by the service, and SHALL not
      //    be created as HistoricalLocation directly by user."
      return association.afterAssociation(transaction, instance,
                                          associatedEntityId);
    });
  });
};

/*
 * Finds or creates an specific entity and associates it to the
 * given instance.
 */
const create = (transaction, instance, modelToAssociateWith,
                association, associatedEntity, exclude, thingLocation) => {
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

    // Given a POST to modelA with an inline entity modelB, the implicit
    // association between modelA and modelB needs to be reflected in the
    // inline entity, in order to avoid mandatory association issues.
    try {
      const modelA = instance.$modelOptions.name.plural;
      const associationsOfModelB = association.target.associations;
      Object.keys(associationsOfModelB).forEach(associationName => {
        if (getModelName(associationName) === modelA) {
          if (associatedEntity[associationName]) {
            throw Object.create({
              name: BAD_REQUEST,
              errno: ERRNO_BAD_REQUEST,
              errors: 'Could not create entity with body ' + associatedEntity
            });
          }
          associatedEntity[associationName] = { '@iot.id': instance.id }
        }
      });
    } catch(error) {
      return Promise.reject(error);
    }

    // In this case, after creating the instance of ModelB, we need
    // to process the body of ModelB to see if there are related entites
    // in it, like modelC.
    return maybeCreate(transaction, associatedInstance,
                       { body: associatedEntity }, exclude, thingLocation);
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
const maybeCreate = (transaction, instance, req, exclude, thingLocation) => {
  return db().then(models => {
    const modelName = instance.$modelOptions.name.plural;
    // relations holds the list of all possible relations for the recently
    // created entity (instance).
    const relations = models[modelName].associations;
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

      const associationName = relations[lastResource.associationName] ?
                              lastResource.associationName :
                              entities[lastResource.associationName];

      req.body[associationName] = { '@iot.id': lastResource.id };
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
    Object.keys(relations).forEach(associationName => {
      const association = relations[associationName];
      let body = req.body[associationName];

      // In the case of creating an Observation whose FeatureOfInterest is the
      // Thing’s Location (that means the Thing entity has a related Location
      // entity), the request of creating the Observation SHOULD NOT include a
      // link to a FeatureOfInterest entity. The service will first
      // automatically create a FeatureOfInterest entity from the Location of
      // the Thing and then link to the Observation.
      if (associationName === featureOfInterest) {
        body = body || featureOfInterestFromLocation(thingLocation);
        if (!body && req.body.Datastream) {
          promises.push(getLocationFromDatastream(req.body.Datastream)
          .then(loc => {
            if (!loc) {
              throw Object.create({
                name: BAD_REQUEST,
                errno: ERRNO_MANDATORY_ASSOCIATION_MISSING,
                errors: 'Missing mandatory association: ' + associationName
              });
            }
            return create(transaction, instance, models[featuresOfInterest],
                          association, featureOfInterestFromLocation(loc),
                          exclude);
          }));

          return;
        }
      }

      // For each possible association we check if the request body contains
      // any reference to the association model.
      if (!body) {
        if (association.mandatory) {
          throw Object.create({
            name: BAD_REQUEST,
            errno: ERRNO_MANDATORY_ASSOCIATION_MISSING,
            errors: 'Missing mandatory association: ' + associationName
          });
        }
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
      const modelToAssociateWith = models[associationName] ||
                                   models[pluralName];

      // For the cases where we are creating an Observation with a missing
      // FeatureOfInterest, we need to check if there is a Location associated
      // to the associated Thing and that Location will be the
      // FeatureOfInterest of this Observation. So we save this Location in the
      // request object, for following calls to maybeCreate while traversing
      // the Datastream body looking for Datastream associations.
      associatedEntities.forEach(associatedEntity => {
        const getLocationAndCreate =
          getLocation(pluralName, modelName, req, associatedEntity)
          .then(_thingLocation => {
              const currentThingLocation = thingLocation || _thingLocation;
              return create(transaction, instance, modelToAssociateWith,
                            association, associatedEntity, exclude,
                            currentThingLocation);
          });

        promises.push(getLocationAndCreate);
      });
    });

    return Promise.all(promises).then(() => instance);
  });
}

const getLocationFromDatastream = (datastreamEntity) => {
  return db().then(models => {
    if (datastreamEntity[iotId]) {
      return findLocation(datastreams, datastreamEntity[iotId], {
        model: models[things],
        include: models[locations]
      });
    }

    if (datastreamEntity.Thing) {
      if (datastreamEntity.Thing[iotId]) {
        return findLocation(things, datastreamEntity.Thing[iotId],
                            models[locations]);
      }

      if (datastreamEntity.Thing.Locations) {
        if (datastreamEntity.Thing.Locations[0][iotId]) {
          const locationId = datastreamEntity.Thing.Locations[0][iotId];
          return findLocation(locations, locationId);
        }

        return Promise.resolve(datastreamEntity.Thing.Locations[0]);
      }
    }

    return Promise.resolve(null);
  });
}

const findLocation = (modelName, id, include = []) => {
  return db().then(models => {
    return models[modelName].findOne({
        where: { id: id },
        include: include
      }).then(instance => {
        try {
          let _currentLoc;
          switch (modelName) {
            case datastreams:
              _currentLoc = instance.Thing.Locations[0];
              break;
            case things:
              _currentLoc = instance.Locations[0];
              break;
            case locations:
              _currentLoc = instance;
              break;
            default:
              break;
          }
          return _currentLoc.dataValues;
        } catch(e) {
          return null;
        }
      });
  });
}

const getLocation = (pluralName, modelName, req, associatedEntity) => {
  let _thingLocation;

  // The entity we are creating is a Datastream, and so, the location can be in
  // its body
  if (modelName === datastreams) {
    return getLocationFromDatastream(req.body);
  }

  // We are associating a Datastream to any other entity
  if (pluralName === datastreams) {
    switch (modelName) {
      case things:
        _thingLocation = Promise.resolve(req.body.Locations ?
            req.body.Locations[0] : null);
        break;
      case sensors:
      case observedProperties:
        _thingLocation = getLocationFromDatastream(associatedEntity);
        break;
      default:
        _thingLocation = Promise.resolve(null);
        break;
    }
    return _thingLocation;
  }

  return Promise.resolve(null);
}

export default {
  applyAssociation,
  maybeCreate
};
