/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import db         from '../models/db';
import response   from '../response';
import { components,
         dataArray,
         dataArrayIotCount,
         datastream,
         error,
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

export default version => {
  return (req, res) => {

    const { result, phenomenonTime, featureOfInterestId } = components;

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

      // Input validation #2: Validate that each object in the input has the
      // required properties.
      validateRequiredFields(body, [datastream, dataArray]);
      validateRequiredFields(body.components, [phenomenonTime, result]);

      // Input validation #3: Validate that the 'components' are one of:
      //    'result', 'phenomenonTime', 'FeatureOfInterest/id'
      body.components.forEach(component => {
        if ([result,
             phenomenonTime,
             featureOfInterestId].indexOf(component) === -1) {
          throw Object.create({
            name: ERR.BAD_REQUEST,
            errno: ERR.ERRNO_BAD_REQUEST,
            errors: 'Invalid component: ' + component
          });
        }
      });

      // Input validation #4: Validate that `body.components` and
      // `body.dataArray` are the same length.
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

      // Input validation #5: Validate that `dataArray@iot.count` and
      // `body.dataArray.length` are the same.
      if (body[dataArrayIotCount] !== body.dataArray.length) {
        throw Object.create({
          name: ERR.BAD_REQUEST,
          errno: ERR.ERRNO_BAD_REQUEST,
          errors: '\'dataArray@iot.count\' doesn\'t match \'dataArray\'' +
                  ' length.'
        });
      }

      // Note: We don't explicitly validate Entity associations.
      // For example, we don't explicitly check for the existence of the
      // Datastream or the FeatureOfInterest (if it is specified).
      // We are delegating this to sequelize enforcing its foreign key
      // constraints.
    };

    const createInstances = observationObjects => {
      return db().then(models => {
        return Promise.all(observationObjects.map(observationObj => {
          return models.createInstance(
            observations, { body: observationObj }
          ).then(instance => {
            return Promise.resolve(instance.id);
          }).catch(() => {
            return Promise.resolve(null);
          });
        }));
      });
    };

    const createObservations = body => {
      let observationObjects = [];
      const resultIndex = body.components.indexOf(result);
      const featureOfInterestIndex =
        body.components.indexOf(featureOfInterestId);
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

    const createResponse = instances => {
      let msg = [];
      const prepath = response.getPrepath(req, version);
      instances.forEach(instance => {
        if (instance) {
          msg = msg.concat(
            prepath + observations + '(' + instance + ')');
        } else {
          msg = msg.concat(error);
        }
      });
      return msg;
    };

    const body = req.body;

    // Input validation #1: The body of request must be an array.
    if (!Array.isArray(body)) {
      return ERR.ApiError(res, 400, ERR.ERRNO_BAD_REQUEST,
                          ERR.BAD_REQUEST, 'Input must be an array');
    }

    let observationObjects = [];
    for (let i = 0; i < body.length; i++) {
      try {
        validateBody(body[i]);
      } catch (ex) {
        return ERR.ApiError(res, 400, ex.errno, ex.name, ex.errors);
      }

      observationObjects =
        observationObjects.concat(createObservations(body[i]));
    }

    createInstances(observationObjects).then((instances) => {
      // Upon successful completion the service SHALL respond with 201 Created.
      // The response message body SHALL contain the URLs of the created
      // Observation entities, where the order of URLs must match with the order
      // of Observations in the dataArray from the request. In the case of the
      // service having exceptions when creating individual observation
      // entities, instead of responding with URLs, the service must specify
      // "error" in the corresponding array element.
      res.status(201).send(createResponse(instances));
    }).catch(() => {
      ERR.ApiError(res, 500, ERR.ERRNO_INTERNAL_ERROR, ERR.INTERNAL_ERROR);
    });
  };
};

