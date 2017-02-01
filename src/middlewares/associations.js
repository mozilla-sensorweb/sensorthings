/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import db       from '../models/db';
import * as ERR from '../errors';
import {
  belongsTo,
  belongsToMany,
  hasMany,
  hasOne
} from '../constants';

import { getModelName } from '../utils';

export default version => {
  return (req, res, next) => {
    // Removes starting and trailing '/' and the version and splits the url
    // in path resources.
    const resources = req.baseUrl
                         .replace(/^\/?|\/?$/, '')
                         .replace(version + '/', '')
                         .split('/');

    // We only care about nested resource paths (i.e. /A(1)/B(1)), navigation
    // links (i.e. /A(1)/B) or association links (i.e. /A(1)/B/$ref), so we
    // just bail out if we are dealing with a simple resource path
    // (i.e. /A or /A(1)).
    if (resources.length <= 1) {
      return next();
    }

    db().then(models => {
      const parseResource = resource => {
        const matched = resource && resource.match(/^(\w+)(?:\((\d+)\))?$/);
        let model;
        let id;
        let associationName;
        if (matched) {
          model = models[getModelName(matched[1])];
          id = matched[2];
          associationName = matched[1];
        } else {
          model = models[resource];
        }
        return { model, id, associationName };
      };

      const verifyAssociations = (resourcesLeft, resource,
                                  previousResource) => {
        if (!resourcesLeft.length) {
          return next();
        }

        previousResource = resource;
        resource = parseResource(resourcesLeft.shift());

        // It is possible that we are handling a url to a property of an
        // entity (9.2.4). Or an address to an associationLink (9.2.7).
        if (!resource.model) {
          return next();
        }

        // We only set 'lastResource' if the resource is a model.
        // i.e in ModelA(1)/ModelB/something or ModelA(1)/ModelB(1)/something
        // lastResource won't be ModelB, but ModelA.
        req.lastResource = previousResource;

        // Check that the association is possible between the two models.
        const previousModel = previousResource.model;
        const previousId = previousResource.id;
        const { model, id, associationName } = resource;
        const association = previousModel.associations[associationName];
        if (!association) {
          return ERR.ApiError(res, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                              ERR.BAD_REQUEST);
        }

        // Check that the association between the two entities actually exists.
        previousModel.findById(previousId).then(previousEntity => {
          if (!previousEntity) {
            return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                ERR.NOT_FOUND);
          }

          const type = association.associationType;
          const name = model.options.name.singular;

          switch (type) {
            case hasMany:
            case belongsToMany:
              // If there's no id, we don't need to check any specific
              // association.
              if (!id) {
                return verifyAssociations(resourcesLeft, resource,
                                          previousResource);
              }

              return previousEntity['has' + name](id).then(isAssociated => {
                // Unless we are checking the last resource of a POST request
                // (i.e. 'Thing' in POST v1.0/Datastreams(34)/Thing)
                // if it's not associated, we throw a 404.
                if (!isAssociated && req.method !== 'POST' &&
                    !resourcesLeft.length) {
                  return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                      ERR.NOT_FOUND);
                }
                verifyAssociations(resourcesLeft, resource, previousResource);
              });
            case hasOne:
            case belongsTo:
              return previousEntity['get' + name]().then(entity => {
                // Unless we are checking the last resource of a POST request
                // (i.e. 'Thing' in POST v1.0/Datastreams(34)/Thing)
                // if it's not associated, we throw a 404.
                if (!entity && req.method !== 'POST' && !resourcesLeft.length) {
                  return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                      ERR.NOT_FOUND);
                }
                resource.id = entity && entity.id;
                verifyAssociations(resourcesLeft, resource, previousResource);
              });
            default:
              return ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR,
                                  ERR.INTERNAL_ERROR,
                                  'Unknown association type');
          }
        }).catch(error => {
          return ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR,
                              ERR.INTERNAL_ERROR, error);
        });
      };

      const resource = parseResource(resources.shift());
      verifyAssociations(resources, resource);
    });
  };
};
