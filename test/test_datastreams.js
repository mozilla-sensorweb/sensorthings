import commonTests  from './common';
import db from '../src/models/db';
import {
  datastream,
  datastreams,
  DatastreamsEntity,
  entities,
  featureOfInterest,
  locations,
  LocationsEntity,
  ObservationsEntity
} from './constants';

import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR,
  ERRNO_BAD_REQUEST
} from '../src/errors';

const mandatory     = [
  'name',
  'description',
  'unitOfMeasurement',
  'observationType'
];
const optional      = ['phenomenonTime', 'resultTime'];

commonTests(datastreams, 8880, mandatory, optional).then(tester => {
  describe('Observations API - specific', () => {
    beforeEach(done => {
      db().then(models => {
        models.sequelize.transaction(transaction => {
          return Promise.all(Object.keys(entities).map(name => {
            return models[name].destroy({ transaction, where: {} });
          }));
        }).then(() => done());
      });
    });

    describe('Check invalid observationType', () => {
      it('should respond 400 if observationType is not valid', done => {
        const body = Object.assign({}, DatastreamsEntity, {
          observationType: 'random'
        });
        tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR, BAD_REQUEST);
      });
    });

    describe('Check circular insert', () => {
      it('should respond 400 if request tries to create a Datastream with an' +
         ' associated Observation that includes a Datastream', done => {
        let body = Object.assign({}, DatastreamsEntity);
        body.Observations = ObservationsEntity;
        tester.postError(done, body, 400, ERRNO_BAD_REQUEST, BAD_REQUEST);
      });
    });

    describe('Check FeaturesOfInterest auto creation', () => {
      it('should respond 201 if a linked Observation doesnt include ' +
         ' FeatureOfInterest, but it includes a Thing with Location', done => {
        db().then(models => {
          const locationEntity = Object.assign({}, LocationsEntity);
          models[locations].create(locationEntity).then(relation => {
            let body = Object.assign({}, DatastreamsEntity);
            body.Observations = [Object.assign({}, ObservationsEntity)];
            Reflect.deleteProperty(body.Observations[0], featureOfInterest);
            Reflect.deleteProperty(body.Observations[0], datastream);
            body.Thing.Locations = [{
              '@iot.id': relation.id
            }];
            const countObject = {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 },
              'Things': { count: 1 },
              'FeaturesOfInterest': { count: 1 }
            }

            tester.postSuccess(done, body, countObject);
          });
        });
      });
    });
  });
});
