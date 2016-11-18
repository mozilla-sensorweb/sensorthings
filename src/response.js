/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Utility module that converts sequelize models into SensorThings format.
 */

import {
  createdAt,
  featuresOfInterest,
  iotCount,
  navigationLink,
  updatedAt
} from './constants';

const FIELDS_TO_FILTER = [
  'id',
  createdAt,
  updatedAt
];

const formatItem = (item, associations, prepath) => {
  // We need to get the data directly from item (and not item.dataValues) so
  // getters and setters of the models are called.
  const name = item.$modelOptions.name;
  // Sequelize does not generate the proper plural for the FeaturesOfInterest
  // model.
  const resourceName = [
    featuresOfInterest
  ].indexOf(name.singular) === -1 ? name.plural : name.singular;
  let formatedItem = {
    '@iot.id': item.id,
    '@iot.selfLink': prepath + resourceName + '(' + item.id + ')'
  };

  associations && associations.forEach(association => {
    formatedItem[association + navigationLink] =
      prepath + resourceName + '(' + item.id + ')/' + association;
  });

  Object.keys(item.dataValues).forEach(key => {
    if (FIELDS_TO_FILTER.indexOf(key) === -1) {
      formatedItem[key] = item[key];
    }
  });

  return formatedItem;
}

const generate = (resource, associations, prepath) => {
  if (resource && Array.isArray(resource)) {
    let response = {};
    response[iotCount] = resource.length;
    response.value = [];
    resource.forEach(item => {
      response.value.push(formatItem(item, associations, prepath));
    });

    return response;
  }

  return formatItem(resource, associations, prepath);
}

module.exports = {
  generate
};
