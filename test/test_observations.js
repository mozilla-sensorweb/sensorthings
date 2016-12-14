import commonTests  from './common';
import db from '../src/models/db';
import {
  featureOfInterest,
  LocationsEntity,
  observations,
  featuresOfInterest,
  datastream,
  datastreams,
  ObservationsEntity,
  DatastreamsEntity
} from './constants';

import * as ERR from '../src/errors';

const mandatory     = [
  'phenomenonTime',
  'result'
];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];

commonTests(observations, 8885, mandatory, optional).then(tester => {
  describe('Observations specific tests', () => {
    beforeEach(done => {
      db().then(models => {
        const toDestroy = [observations, featuresOfInterest, datastreams];
        Promise.all(toDestroy.map(name => {
          return models[name].destroy({ where: {} });
        })).then(() => done());
      });
    });

    describe('POST to association URL', () => {
      it('should return 201 when creating a Observation, pointing to an ' +
         'association URL', done => {
        db().then(models => {
          models[datastreams].create(DatastreamsEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            Reflect.deleteProperty(body, datastream);
            const url = '/v1.0/Datastreams(' + relation.id + ')/Observations';
            tester.postSuccess(done, body, {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 }
            }, url);
          });
        });
      });
    });

    describe('POST without FeatureOfInterest', () => {
      it('should return 400 if no inline Datastream.Location exist', done => {
        let body = Object.assign({}, ObservationsEntity);
        Reflect.deleteProperty(body, featureOfInterest);
        tester.postError(done, body, 400,
                         ERR.ERRNO_MANDATORY_ASSOCIATION_MISSING,
                         ERR.BAD_REQUEST);
      });

      xit('should return 400 when assigning an existing Datastream without ' +
         'location', done => {
        db().then(models => {
          models[datastreams].create(DatastreamsEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = {
              '@iot.id': relation.id
            };
            Reflect.deleteProperty(body, featureOfInterest);
            tester.postError(done, body, 400,
                             ERR.ERRNO_MANDATORY_ASSOCIATION_MISSING,
                             ERR.BAD_REQUEST);
          });
        });
      });

      it('should return 201 if Datastream.Thing.Location exists', done => {
        let body = Object.assign({}, ObservationsEntity);
        Reflect.deleteProperty(body, featureOfInterest);
        body.Datastream.Thing.Locations = Object.assign({}, LocationsEntity);
        const countObject = {
          'Observations': { count: 1 },
          'Datastreams': { count: 1 },
          'FeaturesOfInterest': { count: 1 }
        }
        tester.postSuccess(done, body, countObject);
      });

      xit('should return 201 when linking a Datastream with Location', done => {
        db().then(models => {
          const datastreamEntity = Object.assign({}, DatastreamsEntity);
          datastreamEntity.Thing.Locations = LocationsEntity;
          models[datastreams].create(datastreamEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = {
              '@iot.id': relation.id
            };
            Reflect.deleteProperty(body, featureOfInterest);
            const location = Object.assign({}, LocationsEntity);
            body.Datastream.Thing.Locations = location;
            const countObject = {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 },
              'FeaturesOfInterest': { count: 1 }
            }
            tester.postSuccess(done, body, countObject);
          });
        });
      });
    })
  });
});
