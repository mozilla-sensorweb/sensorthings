/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Utility module that converts sequelize models into SensorThings format.
 */

import {
  hostHeader,
  iotCount,
  iotId,
  iotNextLink,
  iotSelfLink,
  navigationLink,
  protocolHeader
} from './constants';

const FIELDS_TO_FILTER = [
  'id'
];

const formatItem = (item, associations, prepath, options) => {
  const { exclude, ref, select } = options;

  const selected = field => {
    field = field.replace('@iot.', '');
    return !select || (select.indexOf(field) !== -1);
  };

  // We need to get the data directly from item (and not item.dataValues) so
  // getters and setters of the models are called.
  const resourceName = item.$modelOptions.name.plural;

  let formatedItem = {};
  if (selected(iotSelfLink)) {
    formatedItem[iotSelfLink] = prepath + resourceName + '(' + item.id + ')';
  }

  if (ref) {
    // 9.2.7 Usage 7: address to an associationLink.
    return formatedItem;
  }

  if (selected(iotId)) {
    formatedItem[iotId] = item.id;
  }

  associations && associations.forEach(association => {
    const link = association + navigationLink;
    if (selected(association)) {
      formatedItem[link] =
        prepath + resourceName + '(' + item.id + ')/' + association;
    }
  });

  Object.keys(item.dataValues).forEach(key => {
    if (FIELDS_TO_FILTER.concat(exclude).indexOf(key) === -1 &&
        selected(key)) {
      formatedItem[key] = item[key];
    }
  });

  return formatedItem;
}

const getPrepath = (req, version) => {
  const protocol = req.headers[protocolHeader] || req.protocol;
  const host = req.headers[hostHeader] || req.headers.host;
  const prepath = protocol + '://' + host + '/' + version + '/';
  return prepath;
}

const generate = (resource, associations, req, version, options) => {
  const prepath = getPrepath(req, version);

  if (resource && Array.isArray(resource)) {
    const { top, skip, count, totalCount } = options;

    let response = {};

    // The $count system query option with a value of true specifies that the
    // total count of items within a collection matching the request SHALL be
    // returned along with the result. A $count query option with a value of
    // false (or not specified) hints that the service SHALL not return a
    // count.
    if (count !== 'false') {
      response[iotCount] = totalCount;
    }

    if (resource.length) {
      const resourceName = resource[0].$modelOptions.name.plural;

      // The nextLink annotation indicates that a response is only a subset of
      // the requested collection of entities or collection of entity
      // references. It contains a URL that allows retrieving the next subset
      // of the requested collection.
      //
      // We add the next link only if there are items left in the pagination
      // stack.
      const nextSkip = skip ? skip + top : top;
      if (top && (nextSkip < totalCount)) {
        response[iotNextLink] = prepath + resourceName +
                                '?$top=' + top +
                                '&$skip=' + nextSkip;
      }
    }

    response.value = [];
    resource = Array.isArray(resource) ? resource : [resource];
    resource.forEach(item => {
      response.value.push(
        formatItem(item, associations, prepath, options)
      );
    });

    return response;
  }

  return formatItem(resource, associations, prepath, options);
}

module.exports = {
  generate,
  getPrepath
};
