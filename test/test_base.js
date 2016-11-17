import app           from './server';
import should        from 'should';
import supertest     from 'supertest';

const port   = 8081;
const server = supertest.agent(app.listen(port));

const resources = [
  'Datastreams',
  'FeaturesOfInterest',
  'HistoricalLocations',
  'Locations',
  'Observations',
  'ObservedProperties',
  'Sensors',
  'Things'
];

const version = 'v1.0';

let expectedResponse = {};

expectedResponse.value = resources.map((name) => {
  return {
    name: name,
    url: 'http://127.0.0.1:' + port + '/' + version + '/' + name
  }
});

describe('Base API', () => {
  describe('GET /', () => {
    it('should return the list of resources', done => {
      server.get('/' + version + '/')
        .expect('Content-type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.should.be.deepEqual(expectedResponse);
          done();
        });
    });
  });
});
