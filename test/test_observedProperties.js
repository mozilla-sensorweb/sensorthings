import should        from 'should';
import supertest     from 'supertest';
import app           from './server';
import sensorthings  from '../src/sensorthings';

const server = supertest.agent(app);

describe('ObservedProperties API', () => {
  it('should exist', done => {
    server.get('/ObservedProperties')
      .expect('Content-type', /json/)
      .expect(200)
      .end((err, res) => {
        res.status.should.be.equal(200);
        done();
      });
  });
});
