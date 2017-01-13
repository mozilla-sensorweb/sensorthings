/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import db         from '../models/db';
import { datastream,
         featureOfInterest,
         iotId,
         observations } from '../constants';
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
const dataArray = 'dataArray';
const dataArrayIotCount = 'dataArray@iot.count';
const phenomenonTime = 'phenomenonTime';
const result = 'result';
const featureOfInterestId = 'FeatureOfInterest/id';
const exclude = null;

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

      // Validate input.
      // 2) Validate that each object in the input has the required properties.
      validateRequiredFields(body, [datastream, dataArray]);
      validateRequiredFields(body.components, [phenomenonTime, result]);

      // Validate input.
      // 3) Validate that the 'components' are one of:
      //    'result', 'phenomenonTime', 'FeatureOfInterest/id'
      body.components.forEach(component => {
        switch(component) {
          case result:
          case phenomenonTime:
          case featureOfInterestId:
            break;
          default:
          throw Object.create({
            name: ERR.BAD_REQUEST,
            errno: ERR.ERRNO_BAD_REQUEST,
            errors: 'Invalid component: ' + component
          });
        }
      });

      // Validate input.
      // 4) Validate that `body.components` and `body.dataArray` are the same
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

    const createInstances = observationObjects => {
      return new Promise((resolve, reject) => {
        let dbInstancePromises = [];
        db().then(models => {
          observationObjects.forEach(observation => {
            let newReq = Object.create(req);
            newReq.body = observation;
            dbInstancePromises.push(
              models.createInstance(observations, newReq, exclude));
          });
          Promise.all(dbInstancePromises).then(instances => {
            resolve(instances);
          }).catch(ex => {
            reject(ex);
          });
        }).catch(() => {
          ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
        });
      });
    };

    const createObservations = body => {
      let observationObjects = [];
      const resultIndex = body.components.indexOf(result);
      const featureOfInterestIndex =
        body.components.indexOf(featureOfInterest + '/id');
      const phenomenonTimeIndex = body.components.indexOf(phenomenonTime);
      const dataArrayCount = body[dataArrayIotCount];

      for (let i = 0; i < dataArrayCount; i++) {
        let observation = {};
        observation.Datastream = {};
        observation.Datastream[iotId] = body.Datastream[iotId];
        observation.result = body.dataArray[i][resultIndex];
        observation.phenomenonTime = body.dataArray[i][phenomenonTimeIndex];

        // If FeatureOfInterest relation is not specified,
        // it will be extracted from Locations (i.e.,
        // Datastreams-->Things-->Locations).
        if (featureOfInterestIndex > -1) {
          observation.FeatureOfInterest = {};
          observation.FeatureOfInterest[iotId] =
            body.dataArray[i][featureOfInterestIndex];
        }
        observationObjects.push(observation);
      }

      return observationObjects;
    };

    const body = req.body;

    // Validate input.
    // 1) The body of request must be an array.
    if (!Array.isArray(body)) {
      return ERR.ApiError(res, 400, ERR.ERRNO_BAD_REQUEST,
                          ERR.BAD_REQUEST, 'Input must be an array');
    }

    let observationObjects = [];
    for (let i = 0; i < body.length; i++) {
      try {
        validateBody(body[i]);
      } catch(ex) {
        return ERR.ApiError(res, 400, ex.errno, ex.name, ex.errors);
      }

      observationObjects =
        observationObjects.concat(createObservations(body[i]));
    }

    createInstances(observationObjects).then(() => {
      ERR.ApiError(res, 501, ERR.ERRNO_NOT_IMPLEMENTED, ERR.NOT_IMPLEMENTED);
    }).catch(ex => {
      ERR.ApiError(res, 400, ex.errno, ex.name, ex.errors);
    });
  };
};

