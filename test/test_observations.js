import should        from 'should';
import supertest     from 'supertest';
import app           from './server';
import sensorthings  from '../src/sensorthings';

const server = supertest.agent(app);

describe('Observations API', () => {
  it('should exist', done => {
    server.get('/Observations')
      .expect('Content-type', /json/)
      .expect(200)
      .end((err, res) => {
        res.status.should.be.equal(200);
        done();
      });
  });
});
