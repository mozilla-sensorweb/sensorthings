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
  * '[/:Resource(n)]n times/FinalResource(id)?/property?/($value | $ref)?
  *
  * If no FinalEndpoint is provided, it matches any of the available endpoints.
  * This regexp will match with and route the FinalResource path with params
  *
  * 0 => id (if exists)
  * 1 => property (if exists)
  * 2 => $value/$ref (if exists)
  *
  */

  generate: endpoint => {
    const possibleEndpoints = '(?:' + entities.join('|') + ')';
    const previousEndpoints = '^\\/(?:' + possibleEndpoints + '\\(\\d+\\)\\/)*';
    const finalEndpoint = endpoint ? endpoint : possibleEndpoints;
    const id = '(?:\\((\\d+)\\))?';
    const property = '(?:\\/([a-z]\\w*)(?:\\/(\\$value|\\$ref))?)?'
    const route = previousEndpoints + finalEndpoint + id + property + '$';

    return new RegExp(route);
  }
 }
