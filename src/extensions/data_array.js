/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { datastream,
         dataArray,
         phenomenonTime,
         result } from '../constants';
import * as ERR   from '../errors';

/**
 * Implementation of 13.2 "Create Observation entities with dataArray"
 *
 * Similar to the SWE DataArray in the OGC SOS, SensorThings API also
 * provides the support of dataArray (in addition to formatting every
 * observation entity as a JSON object) to aggregate multiple Observation
 * entities and reduce the request (e.g., POST) and response (e.g., GET)
 * size. SensorThings mainly use dataArray in two scenarios: (1) get
 * Observation entities in dataArray, and (2) create Observation entities
 * with dataArray.
 *
 **/

export default () => {
  return (req, res) => {

    // Required properties of an object in the body:
    //   - body.Datastream
    //   - body.dataArray
    //   - body.components.phenomenonTime
    //   - body.components.result
    const validateBody = body => {

      const validateRequiredFields = (obj, fields) => {

        const find = (source, field) => {
          return Array.isArray(source) ? source.indexOf(field) !== -1 :
                                         source[field];
        }

        fields.forEach(field => {
          if (!find(obj, field)) {
            throw Object.create({
              name: ERR.BAD_REQUEST,
              errno: ERR.ERRNO_BAD_REQUEST,
              errors: 'Missing required field: ' + field
            });
          }
        });
      };

      // 2) Validate that each object in the input has the required properties.
      validateRequiredFields(body, [datastream, dataArray]);
      validateRequiredFields(body.components, [phenomenonTime, result]);

      // 3) Validate that `body.components` and `body.dataArray` are the same
      //    length.
      const componentsLength = body.components.length;
      body.dataArray.forEach(da => {
        if (componentsLength !== da.length) {
          throw Object.create({
            name: ERR.BAD_REQUEST,
            errno: ERR.ERRNO_BAD_REQUEST,
            errors: '\'components\' don\'t match \'dataArray\' values.'
          });
        }
      });
    };

    const body = req.body;

    // Validate input.
    // 1) The body of request must be an array.
    if (!Array.isArray(body)) {
      return ERR.ApiError(res, 400, ERR.ERRNO_BAD_REQUEST,
                   ERR.BAD_REQUEST, 'Input must be an array');
    }

    for (let i = 0; i < body.length; i++) {
      try {
        validateBody(body[i]);
      } catch (ex) {
        return ERR.ApiError(res, 400, ex.errno, ex.name, ex.errors);
      }
    }

    ERR.ApiError(res, 501, ERR.ERRNO_NOT_IMPLEMENTED, ERR.NOT_IMPLEMENTED);
  };
};

