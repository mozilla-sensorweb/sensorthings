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

// XXX Response urls should be absolute #13.
const formatItem = (item, associations) => {
  // We need to get the data directly from item (and not item.dataValues) so
  // getters and setters of the models are called.
  const resourceName = item.$modelOptions.name.plural;
  let formatedItem = {
    '@iot.id': item.id,
    '@iot.selfLink': '/' + resourceName + '(' + item.id + ')'
  };

  associations && associations.forEach(association => {
    formatedItem[association + '@iot.navigationLink'] =
      '/' + resourceName + '(' + item.id + ')/' + association;
  });

  Object.keys(item.dataValues).forEach(key => {
    if (FIELDS_TO_FILTER.indexOf(key) === -1) {
      formatedItem[key] = item[key];
    }
  });

  return formatedItem;
}

const generate = (resource, associations) => {
  if (resource && Array.isArray(resource)) {
    let response = {};
    response['@iot.count'] = resource.length;
    response.value = [];
    resource.forEach(item => {
      response.value.push(formatItem(item, associations));
    });

    return response;
  }

  return formatItem(resource, associations);
}

module.exports = {
  generate
};
