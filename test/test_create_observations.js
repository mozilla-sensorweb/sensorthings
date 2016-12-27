import app           from './server';
import supertest     from 'supertest';
import should        from 'should';
import { createObservations } from '../src/constants';

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

const CreateObservationsRequestOneObservation = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
    [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

const CreateObservationsRequestMissingDatastream = [{
  components: [ 'phenomenonTime', 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ '2010-12-23T10:20:00-0700', 20, 1 ],
    [ '2010-12-23T10:21:00-0700', 30, 1 ] ]
}];

const CreateObservationsRequestMissingPhenomenonTime = [{
  Datastream: { '@iot.id': 1 },
  components: [ 'result', 'FeatureOfInterest/id' ],
  'dataArray@iot.count': 2,
  dataArray: [ [ 20, 1 ],
    [ 30, 1 ] ]
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
  it('Valid request body', done => {
    postError(done, CreateObservationsRequestOneObservation, 501);
  });

  it('Missing Datastream', done => {
    postError(done, CreateObservationsRequestMissingDatastream, 400,
              'Missing required field: Datastream');
  });

  it('Missing PhenomenonTime', done => {
    postError(done, CreateObservationsRequestMissingPhenomenonTime, 400,
              'Missing required field: phenomenonTime');
  });

  it('Components, dataArray mismatch', done => {
    postError(done, CreateObservationsRequestComponentsDataArrayMismatch, 400,
              '\'components\' don\'t match \'dataArray\' values.');
  });

  it('Input is not an array', done => {
    postError(done, CreateObservationsRequestNotArray, 400,
              'Input must be an array');
  });
});

