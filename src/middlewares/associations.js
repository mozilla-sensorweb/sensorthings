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

export default (req, res, next) => {
  // Removes starting and trailing '/' and splits url in path resources.
  const resources = req.originalUrl.replace(/^\/?|\/?$/, '').split('/');

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
      if (matched) {
        model = models[matched[1]];
        id = matched[2];
      } else {
        model = models[resource];
      }
      return { model, id };
    };

    const verifyAssociations = (resourcesLeft, resource, previousResource) => {
      if (!resourcesLeft.length) {
        return next();
      }

      previousResource = resource;
      resource = parseResource(resourcesLeft.shift());

      req.lastResource = previousResource;

      // It is possible that we are handling a url to a property of an
      // entity (9.2.4)
      if (!resource.model) {
        return next();
      }

      // Check that the association is possible between the two models.
      const previousModel = previousResource.model;
      const previousId = previousResource.id;
      const { model, id } = resource;
      const association = previousModel.associations[model.name];
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

        // If there's no id, we don't need to check any specific association.
        if (!id) {
          return verifyAssociations(resourcesLeft, resource, previousResource);
        }

        switch (association.associationType) {
          case hasMany:
          case belongsToMany:
            return previousEntity['has' + model.options.name.singular](id)
            .then(isAssociated => {
              if (!isAssociated) {
                return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                    ERR.NOT_FOUND);
              }
              verifyAssociations(resourcesLeft, resource, previousResource);
            });
          case hasOne:
          case belongsTo:
            return previousEntity['get' + model.name]().then(entity => {
              if (!entity || entity.id !== id) {
                return ERR.ApiError(res, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                                    ERR.NOT_FOUND);
              }

              verifyAssociations(resourcesLeft, resource, previousResource);
            });
          default:
            return ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR,
                                ERR.INTERNAL_ERROR);
        }
      }).catch(() => {
        return ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR,
                            ERR.INTERNAL_ERROR);
      });
    };

    const resource = parseResource(resources.shift());
    verifyAssociations(resources, resource);
  });
};
