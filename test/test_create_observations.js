import app           from './server';
import db            from '../src/models/db';
import supertest     from 'supertest';
import should        from 'should';
import { createObservations } from '../src/constants';
import * as CONST    from './constants';

const endpoint = '/v1.0/' + createObservations;
const server   = supertest.agent(app.listen(8889));
const { result, phenomenonTime, featureOfInterestId } = CONST.components;
const error = CONST.error;

db().then(models => {
  const postSuccess = (done, body, expected) => {

    server.post(endpoint).send(body)
    .expect(201)
    .end((err, res) => {

      const getInstance = (url) => {
        if (url === error) {
          return Promise.resolve({ error });
        }

        let re = /.+\((\d+)\)$/;
        let id = re.exec(url)[1];
        return models[CONST.observations].findById(id);
      };

      should.not.exist(err);
      res.status.should.be.equal(201);

      const response = JSON.parse(res.text);
      Promise.all(response.map(url => {
        return getInstance(url);
      })).then((instances) => {
        let instance = {};
        for (let i = 0; i < instances.length; i++) {
          if (instances[i].error) {
            instance = instances[i];
          } else {
            instance = {
              datastreamId: instances[i].DatastreamId,
              result: instances[i].result,
              phenomenonTime: instances[i].phenomenonTime
            }

            // Only include FeatureOfInterest Id if the test is expecting it.
            if (expected[i].featureOfInterestId) {
              instance.featureOfInterestId = instances[i].FeatureOfInterestId;
            }
          }

          expected[i].should.be.deepEqual(instance);
        }
        done();
      });
    });
  };

  const postError = (done, body, code, message) => {
    server.post(endpoint).send(body)
    .expect(code)
    .end((err, res) => {
      should.not.exist(err);
      res.status.should.be.equal(code);
      message && res.body.message.should.be.equal(message);
      done();
    });
  };

  // The Datastream iotId of the following requests is null either because
  // it will be set by the test when the Datastream instance is created or
  // because the Datastream iotId need only be present to satisfy the
  // requirement that the `CreateObservations` request have a Datastream
  // association.
  const CreateObservationsRequest = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 4
  }];

  const CreateObservationsRequestNoFoI = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result ],
    'dataArray@iot.count': 2,
    dataArray: [ [ '2010-12-23T10:20:00.000Z', 20 ],
                 [ '2010-12-23T10:21:00.000Z', 21 ] ]
  }];

  const CreateObservationsRequestMissingDatastream = [{
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 2
  }];

  const CreateObservationsRequestMissingResult = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, featureOfInterestId ],
    'dataArray@iot.count': 2
  }];

  const CreateObservationsRequestMissingPhenomenonTime = [{
    Datastream: { '@iot.id': null },
    components: [ result, featureOfInterestId ],
    'dataArray@iot.count': 2
  }];

  const badFoiId = 'FeatureOfInterset/id';
  const CreateObservationsRequestInvalidFeatureOfInterestComponent = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, badFoiId ],
    'dataArray@iot.count': 2
  }];

  const unknownComponent = 'unknownComponenent';
  const CreateObservationsRequestUnknownComponent = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, unknownComponent ],
    'dataArray@iot.count': 2
  }];

  const CreateObservationsRequestComponentsDataArrayMismatch = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 2,
    dataArray: [ [ '2010-12-23T10:20:00:000Z', 1 ],
                 [ '2010-12-23T10:21:00:000Z', 1 ] ]
  }];

  const CreateObservationsRequestIotCountDataArrayLengthMismatch = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result ],
    'dataArray@iot.count': 1,
    dataArray: [ [ '2010-12-23T10:20:00:000Z', 1 ],
                 [ '2010-12-23T10:21:00:000Z', 1 ] ]
  }];

  // Datastream iotId of the first object in the request body is set by the
  // test after the Datastream instance is created. The Datastream iotId
  // of the second object in the request body is intended to be invalid.
  const CreateObservationsRequestInvalidDatastream = [{
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 2,
    dataArray: [ [ '2010-12-23T10:20:00.000Z', 20, 1 ],
                 [ '2010-12-23T10:21:00.000Z', 21, 1 ] ]
  }, {
    Datastream: { '@iot.id': 99 },
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 2,
    dataArray: [ [ '2010-12-23T10:20:00.000Z', 20, 1 ],
                 [ '2010-12-23T10:21:00.000Z', 21, 1 ] ]
  }];

  const CreateObservationsRequestNotArray = {
    Datastream: { '@iot.id': null },
    components: [ phenomenonTime, result, featureOfInterestId ],
    'dataArray@iot.count': 2
  };

  const DatastreamWithLocationEntity =
    Object.assign({}, CONST.DatastreamsEntity, {
    'Thing': Object.assign({}, CONST.ThingsEntity, {
      'Locations': [CONST.LocationsEntity]
    }),
    'ObservedProperty': CONST.ObservedPropertiesEntity,
    'Sensor': CONST.SensorsEntity
  });

  [CreateObservationsRequest[0],
   CreateObservationsRequestMissingDatastream[0],
   CreateObservationsRequestMissingResult[0],
   CreateObservationsRequestMissingPhenomenonTime[0],
   CreateObservationsRequestInvalidFeatureOfInterestComponent[0],
   CreateObservationsRequestUnknownComponent[0],
   CreateObservationsRequestNotArray ].forEach(body => {
    let valueArray = [];
    for (let i = 0; i < body[CONST.dataArrayIotCount]; i++) {
      // Create different `phenomenonTime`s and `result`s for each request.
      // `FeatureOfInterest/id` here is a placeholder that will be
      // set by the test when the FeatureOfInterest instance is created.
      valueArray.push(['2010-12-23T10:2' + i + ':00.000Z', 20 + i, 1]);
    }
    body.dataArray = [];
    body.dataArray = body.dataArray.concat(valueArray);
  });

  describe('CreateObservations tests', () => {

    beforeEach(done => {
      models.sequelize.transaction(transaction => {
        return Promise.all(Object.keys(CONST.entities).map(name => {
          return models[name].destroy({ transaction, where: {} });
        }));
      }).then(() => done());
    });

    it('Create observations specifying FeatureOfInterest', done => {
      let body = CreateObservationsRequest;

      models[CONST.datastreams].create(
        CONST.DatastreamsEntity).then((relation) => {
        const datastreamId = relation.id;
        body[0].Datastream[CONST.iotId] = datastreamId;
        models[CONST.featuresOfInterest].create(
          CONST.FeaturesOfInterestEntity).then((foiRelation) => {
          const featureOfInterestIndex =
            body[0].components.indexOf(featureOfInterestId);
          body[0].dataArray.forEach(da => {
            da[featureOfInterestIndex] = foiRelation.id;
          });
          let expected = [];
          for (let i = 0; i < body[0][CONST.dataArrayIotCount]; i++) {
            expected.push({
                  datastreamId: datastreamId,
                  result: (20 + i).toString(),
                  phenomenonTime: '2010-12-23T10:2' + i + ':00.000Z',
                  featureOfInterestId: foiRelation.id
            });
          }
          postSuccess(done, body, expected);
        });
      });
    });

    it('Create observations without specifying FeatureOfInterest', done => {
      let body = CreateObservationsRequestNoFoI;

      server.post('/v1.0/Datastreams').send(DatastreamWithLocationEntity)
      .expect('Content-Type', /json/)
      .expect(201)
      .end((err, res) => {
        should.not.exist(err);
        let instance = JSON.parse(res.text);
        const datastreamId = instance[CONST.iotId];
        body[0].Datastream[CONST.iotId] = datastreamId;

        let expected = [];
        for (let i = 0; i < body[0][CONST.dataArrayIotCount]; i++) {
          expected.push({
                datastreamId: datastreamId,
                result: (20 + i).toString(),
                phenomenonTime: '2010-12-23T10:2' + i + ':00.000Z'
          });
        }
        postSuccess(done, body, expected);

      });
    });

    it('Missing Datastream', done => {
      postError(done, CreateObservationsRequestMissingDatastream, 400,
                'Missing required field: Datastream');
    });

    it('Missing result component', done => {
      postError(done, CreateObservationsRequestMissingResult, 400,
                'Missing required field: result');
    });

    it('Missing phenomenonTime component', done => {
      postError(done, CreateObservationsRequestMissingPhenomenonTime, 400,
                'Missing required field: phenomenonTime');
    });

    it('Invalid \'FeatureOfInterest/id\' component', done => {
      postError(done,
        CreateObservationsRequestInvalidFeatureOfInterestComponent,
          400, 'Invalid component: ' + badFoiId);
    });

    it('Unknown component', done => {
      postError(done,
        CreateObservationsRequestUnknownComponent,
          400, 'Invalid component: ' + unknownComponent);
    });

    it('Components, dataArray mismatch', done => {
      postError(done,
        CreateObservationsRequestComponentsDataArrayMismatch, 400,
          '\'components\' don\'t match \'dataArray\' values.');
    });

    it('iot.count, dataArray length mismatch', done => {
      postError(done,
        CreateObservationsRequestIotCountDataArrayLengthMismatch, 400,
          '\'dataArray@iot.count\' doesn\'t match \'dataArray\' length.');
    });

    it('Input is not an array', done => {
      postError(done, CreateObservationsRequestNotArray, 400,
                'Input must be an array');
    });

    it('Invalid association: Datastream', done => {
      let body = CreateObservationsRequestInvalidDatastream;

      const expected = [];
      models[CONST.datastreams].create(
        CONST.DatastreamsEntity).then((relation) => {
        const datastreamId = relation.id;

        // The first request element should have a valid Datastream relation.
        // The second should have an invalid relation (i.e., don't set it here).
        body[0].Datastream[CONST.iotId] = datastreamId;

        models[CONST.featuresOfInterest].create(
          CONST.FeaturesOfInterestEntity).then((foiRelation) => {
          body.forEach(obj => {
            const featureOfInterestIndex =
              obj.components.indexOf(featureOfInterestId);
            obj.dataArray.forEach(da => {
              da[featureOfInterestIndex] = foiRelation.id;
            });
          });

          expected.push({
            datastreamId: datastreamId,
            result: '20',
            phenomenonTime: '2010-12-23T10:20:00.000Z',
            featureOfInterestId: foiRelation.id
          });
          expected.push({
            datastreamId: datastreamId,
            result: '21',
            phenomenonTime: '2010-12-23T10:21:00.000Z',
            featureOfInterestId: foiRelation.id
          });
          expected.push({ error });
          expected.push({ error });

          postSuccess(done, body, expected);
        });
      });
    });

    it('Invalid association: FeatureOfInterest/id', done => {
      let body = CreateObservationsRequest;

      models[CONST.datastreams].create(
        CONST.DatastreamsEntity).then((relation) => {
        const datastreamId = relation.id;
        body[0].Datastream[CONST.iotId] = datastreamId;
        models[CONST.featuresOfInterest].create(
          CONST.FeaturesOfInterestEntity).then(() => {
          const featureOfInterestIndex =
            body[0].components.indexOf(featureOfInterestId);
          body[0].dataArray.forEach(da => {
            da[featureOfInterestIndex] = 99999;
          });
          let expected = [];
          for (let i = 0; i < body[0][CONST.dataArrayIotCount]; i++) {
            expected.push({ error });
          }
          postSuccess(done, body, expected);
        });
      });
    });
  });
});

