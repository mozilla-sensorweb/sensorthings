/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { entities, singularEntities }  from './constants';

/*
 * Module with utility shared methods
 */

const pluralNames = Object.keys(entities);
const singularNames = pluralNames.map(entityName => {
  return entities[entityName];
});

let singularAndPlural = [];
pluralNames.forEach(entityName => {
  singularAndPlural.push(entityName, entities[entityName]);
});


const noCapture = (pattern) => {
  return '(?:' + pattern + ')';
};

const separateBy = (char, pattern) => {
  return noCapture('(?:' + pattern + char + ')*' +
         noCapture(pattern));
};

const possibleEndpoints = noCapture(singularAndPlural.join('|'));

const route = {
  pathToModel: separateBy('\\/', possibleEndpoints),

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
    let routeExpr = '^\\/' + version + '\\/';
    const id = '\\((\\d+)\\)';
    const noCaptureId = '\\(\\d+\\)';
    const singularEndpoints = noCapture(singularNames.join('|'));
    const pluralEndpoints = noCapture(pluralNames.join('|'));
    const pluralAndId = noCapture(pluralEndpoints + noCaptureId);
    const previousEndpoints =  noCapture(pluralAndId + '|' + singularEndpoints);
    routeExpr += noCapture(previousEndpoints + '\\/') + '*';

    const ref = '\\/(\\$ref)';
    const propertyAndValue = '(?:\\/([a-z]\\w*)(?:\\/(\\$value))?)?';
    const singleInstance = noCapture(propertyAndValue + '|' + ref);
    const idPropAndValue = noCapture(id + propertyAndValue) + '?';
    const listInstances = noCapture(idPropAndValue + '|' + ref);

    if (!endpoint) {
      const singularOptions = noCapture(singularEndpoints + singleInstance);
      const pluralOptions = noCapture(pluralEndpoints + listInstances);
      routeExpr += noCapture(singularOptions + '|' + pluralOptions);
      return new RegExp(routeExpr + '$');
    }

    const singEndpointOptions = entities[endpoint]  + singleInstance;
    const pluralEndpointOptions = endpoint + listInstances;
    routeExpr += noCapture(pluralEndpointOptions + '|' + singEndpointOptions);

    return new RegExp(routeExpr + '$');
  },
  singularNames,
  pluralNames,
  singularAndPlural,
  noCapture,
  separateBy,
  possibleEndpoints
};

exports.route = route;

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

/*
 * Parses a request body to get an object with all the entities defined
 * inside it.
 */
const parseEntities = (body, parsed) => {
  if (!parsed) {
    parsed = {};
  }

  body = Array.isArray(body) ? body : [body];
  body.forEach(bodyPart => {
    Object.keys(bodyPart).forEach(property => {
      const isPluralEntity = !!entities[property];
      const isSingularEntity = !!singularEntities[property];

      if (isPluralEntity) {
        if (!parsed[property]) {
          parsed[property] = [];
        }

        parsed[property] = parsed[property].concat(bodyPart[property]);
      } else if (isSingularEntity) {
        parsed[property] = bodyPart[property];
      }

      if (isPluralEntity || isSingularEntity) {
        return parseEntities(bodyPart[property], parsed);
      }
    });
  });

  return parsed;
}
exports.parseEntities = parseEntities;
