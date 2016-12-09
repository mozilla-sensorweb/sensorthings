import db           from '../src/models/db';
import commonTests  from './common';
import * as CONST   from './constants';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType', 'metadata'];

commonTests(CONST.sensors, 8887, mandatory).then(tester => {
  describe('Sensors API - specific', () => {
    describe('Check invalid ecodingTypes', () => {

      [CONST.encodingTypes.UNKNOWN,
       CONST.encodingTypes.GEO_JSON,
       CONST.encodingTypes.TEXT_HTML,
       CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
        it('should respond 400 if encodingType is ' + type,
          done => {
          const body = Object.assign({}, CONST.SensorsEntity, {
            encodingType: type,
          });
          tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR,
                           BAD_REQUEST);
        });
      });
    });

    describe('Get FeaturesOfInterest from Locations', () => {
      beforeEach(done => {
        db().then(models => {
          models.sequelize.transaction(transaction => {
            return Promise.all(Object.keys(CONST.entities).map(name => {
              return models[name].destroy({ transaction, where: {} });
            }));
          }).then(() => done());
        });
      });

      it('should respond 201 when inserting a Sensor with a Observation ' +
         'FeatureOfInterest, but with Locations', done => {
        const body = Object.assign({}, CONST.SensorsEntity, {
          'Datastreams': [Object.assign({}, CONST.DatastreamsEntity, {
            'Thing': Object.assign({}, CONST.ThingsEntity, {
              'Locations': [Object.assign({}, CONST.LocationsEntity)]
            }),
            'Sensor': undefined,
            'Observations': [Object.assign({}, CONST.ObservationsEntity, {
              'FeatureOfInterest': undefined,
              'Datastream': undefined
            })]
          })]
        });
        tester.postSuccess(done, body, {
          'Sensors': { count: 1 },
          'Datastreams': { count: 1 },
          'Things': { count: 1 },
          'Locations': { count: 1 },
          'FeaturesOfInterest': { count: 1 },
          'Observations': { count: 1 }
        });
      });
    });
  });
});
