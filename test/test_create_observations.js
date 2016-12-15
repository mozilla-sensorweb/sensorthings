import app           from './server';
import supertest     from 'supertest';
import should        from 'should';
import { createObservations } from '../src/constants';
import { CreateObservationsRequestOneObservation,
         CreateObservationsRequestMissingDatastream,
         CreateObservationsRequestMissingPhenomenonTime,
         CreateObservationsRequestComponentsDataArrayMismatch,
         CreateObservationsRequestNotArray } from './constants';

const endpoint = '/v1.0/' + createObservations;
const server   = supertest.agent(app.listen(8889));

const postSuccess = (body, done) => {
  server.post(endpoint).send(body)
  .expect(201)
  .end((err, res) => {
    should.not.exist(err);
    res.status.should.be.equal(201);
    done();
  });
};

const postError = (body, message, done) => {
  server.post(endpoint).send(body)
  .expect(400)
  .end((err, res) => {
    should.not.exist(err);
    res.status.should.be.equal(400);
    res.body.message.should.be.equal(message);
    done();
  });
};

describe('CreateObservations tests', () => {

  it('Valid request body', done => {
    postSuccess(CreateObservationsRequestOneObservation, done);
  });

  it('Missing Datastream', done => {
    postError(CreateObservationsRequestMissingDatastream,
              'Missing required field: Datastream',
              done);
  });

  it('Missing PhenomenonTime', done => {
    postError(CreateObservationsRequestMissingPhenomenonTime,
              'Missing required field: phenomenonTime',
              done);
  });

  it('Components, dataArray mismatch', done => {
    postError(CreateObservationsRequestComponentsDataArrayMismatch,
              '\'components\' don\'t match \'dataArray\' values.',
              done);
  });

  it('Input is not an array', done => {
    postError(CreateObservationsRequestNotArray,
              'Input must be an array',
              done);
  });
});

