/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { entities }  from './constants';

/*
 * Module with utility shared methods
 */

 exports.route = {

  /*
  * Method that generates a URL regexp with format:
  *
  * '[/:Resource(n)]n times/FinalResource((id)?/property?/($value) | $ref)?
  *
  * If no FinalEndpoint is provided, it matches any of the available endpoints.
  * This regexp will match with and route the FinalResource path with params
  *
  * 0 => id (if exists)
  * 1 => property (if exists)
  * 2 => $value/$ref (if exists)
  *
  */

  generate: (version, endpoint) => {
    let singularAndPlural = [];
    Object.keys(entities).forEach(entityName => {
      singularAndPlural.push(entityName, entities[entityName]);
    });
    const possibleEndpoints = '(?:' + singularAndPlural.join('|') + ')';
    const previousEndpoints =
      '^\\/' + version + '\\/(?:' + possibleEndpoints + '\\(\\d+\\)\\/)*';
    const endpointPlural = '(?:' + endpoint + '|' + entities[endpoint] + ')';
    const finalEndpoint = endpoint ? endpointPlural : possibleEndpoints;
    const id = '(?:\\((\\d+)\\)';
    const ref = '\\/(\\$ref)';
    const propertyAndValue = '(?:\\/([a-z]\\w*)(?:\\/(\\$value))?)?)?';
    const idAndProperty = '(?:' + id + propertyAndValue + ')';
    const propertyOrRef = '(?:' + idAndProperty + '|' + ref + ')?';
    const route = previousEndpoints + finalEndpoint + propertyOrRef + '$';
    return new RegExp(route);
  }
 }

 exports.getModelName = name => {
    let plural;
    Object.keys(entities).forEach(modelName => {
      if (entities[modelName] === name) {
        plural = modelName;
        return;
      }
    });
    return plural || name;
 }
