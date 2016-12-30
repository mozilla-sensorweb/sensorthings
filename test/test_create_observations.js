import app           from './server';
import db            from '../src/models/db';
import supertest     from 'supertest';
import should        from 'should';
import { createObservations } from '../src/constants';
import { datastreams,
         DatastreamsEntity,
         entities,
         featureOfInterest,
         featuresOfInterest,
         iotId,
         FeaturesOfInterestEntity } from './constants';

const endpoint = '/v1.0/' + createObservations;
const server   = supertest.agent(app.listen(8889));

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

const CreateObservationsRequest = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
               [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

/*
const CreateObservationsRequestNoFoI = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20 ],
               [ '2010-12-23T10:21:00-0700', 30 ] ]
}];
*/

const CreateObservationsRequestMissingDatastream = [{
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
               [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

const CreateObservationsRequestMissingResult = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 1 ],
               [ '2010-12-23T10:20:00-0700', 1 ] ]
}];

const CreateObservationsRequestMissingPhenomenonTime = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ 20, 1 ],
               [ 30, 1 ] ]
}];

const badFoi = 'FeatureOfInterset/id';
const CreateObservationsRequestInvalidFeatureOfInterestComponent = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', badFoi ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
    [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

const unknownComponent = 'unknownComponenent';
const CreateObservationsRequestUnknownComponent = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', unknownComponent ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
    [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

const CreateObservationsRequestComponentsDataArrayMismatch = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 1 ],
    [ '2010-12-23T10:21:00-0700', 1 ] ]
}];

const CreateObservationsRequestNotArray = {
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
    [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
};

describe('CreateObservations tests', () => {

  beforeEach(done => {
    db().then(models => {
      models.sequelize.transaction(transaction => {
        return Promise.all(Object.keys(entities).map(name => {
          return models[name].destroy({ transaction, where: {} });
        }));
      }).then(() => done());
    });
  });

  it('Create observations specifying FeatureOfInterest', done => {
    db().then(models => {
      let body = JSON.parse(JSON.stringify(CreateObservationsRequest));

      models[datastreams].create(DatastreamsEntity).then((relation) => {
        body[0].Datastream[iotId] = relation.id;
        models[featuresOfInterest].create(FeaturesOfInterestEntity).then(
          (foiRelation) => {
          const featureOfInterestIndex =
            body[0].components.indexOf(featureOfInterest + '/id');
          body[0].dataArray.forEach(da => {
            da[featureOfInterestIndex] = foiRelation.id;
          });
          postError(done, body, 501);
        });
      });
    });
  });

/*
  it('Create observations without specifying FeatureOfInterest', done => {
    db().then(models => {
      let body = JSON.parse(JSON.stringify(CreateObservationsRequestNoFoI));
      let datastreamsEntity = {
         "unitOfMeasurement": {
           "symbol": "μg/m³",
           "name": "PM 2.5 Particulates (ug/m3)",
           "definition": "http://unitsofmeasure.org/ucum.html"
         },
         "observationType":
         "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
         "description": "Air quality readings",
         "name": "air_quality_readings",
         "Thing": {
           "description": "A SensorWeb thing",
           "name":"SensorWebThing",
           "properties": {
             "organisation": "Mozilla",
             "owner": "Mozilla"
           },
           "Locations": [{
             "description": "My backyard",
             "name": "My backyard",
             "encodingType": "application/vnd.geo+json",
             "location": {
               "type": "Point",
               "coordinates": [-555.123, 66.234]
             }
           }]
         },
         "ObservedProperty": {
           "name": "PM 2.5",
           "description": "Particle pollution.",
           "definition":
             "https://airnow.gov/index.cfm?action=aqibasics.particle"
         },
         "Sensor": {
           "description": "PM 2.5 sensor",
           "name": "PM25sensor",
           "encodingType": "application/pdf",
           "metadata": "http://particle-sensor.com/"
         }
      };
      models[datastreams].create(datastreamsEntity).then((relation) => {
        body[0].Datastream[iotId] = relation.id;
        console.log('body:', JSON.stringify(body));
        postError(done, body, 501);
      });
    });
  });
*/

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
    postError(done, CreateObservationsRequestInvalidFeatureOfInterestComponent,
              400, 'Invalid component: ' + badFoi);
  });

  it('Unknown component', done => {
    postError(done, CreateObservationsRequestUnknownComponent,
              400, 'Invalid component: ' + unknownComponent);
  });

  it('Components, dataArray mismatch', done => {
    postError(done, CreateObservationsRequestComponentsDataArrayMismatch, 400,
              '\'components\' don\'t match \'dataArray\' values.');
  });

  it('Input is not an array', done => {
    postError(done, CreateObservationsRequestNotArray, 400,
              'Input must be an array');
  });

  it('Invalid assoication: Datastream not found', done => {
    db().then(models => {
      let body = JSON.parse(JSON.stringify(CreateObservationsRequest));

      models[featuresOfInterest].create(FeaturesOfInterestEntity).then(
        (foiRelation) => {
        const featureOfInterestIndex =
          body[0].components.indexOf(featureOfInterest + '/id');
        body[0].dataArray.forEach(da => {
          da[featureOfInterestIndex] = foiRelation.id;
        });
        postError(done,
                  body,
                  400,
                  'Invalid association. Datastream with id 1 not found');
      });
    });
  });

  it('Invalid assoication: FeatureOfInterest not found', done => {
    db().then(models => {
      let body = JSON.parse(JSON.stringify(CreateObservationsRequest));

      models[datastreams].create(DatastreamsEntity).then((relation) => {
        body[0].Datastream[iotId] = relation.id;
        postError(done,
                  body,
                  400,
                  'Invalid association. FeatureOfInterest with id 1 not found');
      });
    });
  });

});

