/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Utility module that converts sequelize models into SensorThings format.
 */

const FIELDS_TO_FILTER = [
  'id',
  'createdAt',
  'updatedAt'
];

const formatItem = function formatItem (item) {
  const itemData = item.dataValues;
  const resourceName = item.$modelOptions.name.plural;

  let formatedItem = {
    '@iot.id': itemData.id,
    '@iot.selfLink': '/' + resourceName + '(' + itemData.id + ')'
  };

  Object.keys(itemData).forEach(key => {
    if (FIELDS_TO_FILTER.indexOf(key) === -1) {
      formatedItem[key] = itemData[key];
    }
  });

  return formatedItem;
}

const generate = function generate (resource) {
  if (resource && Array.isArray(resource)) {
    let response = {};
    response['@iot.count'] = resource.length;
    response.value = [];
    resource.forEach(item => {
      response.value.push(formatItem(item));
    });

    return response;
  }

  return formatItem(resource);
}

module.exports = {
  generate
};
