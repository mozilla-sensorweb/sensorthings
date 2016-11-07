/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';

import app           from './server';
import should        from 'should';
import supertest     from 'supertest';

const server = supertest.agent(app);

describe('Resource path', () => {
  describe('Invalid URLs', () => {
    ['/(1)/Things',
     '/Sensors(1/Things',
     '/NotAValidEndpoint(1)/Things',
     '/Things/(1)',
     '///Things'].forEach(url => {
       it('GET ' + url + ' should respond 404 NOT_FOUND', done => {
        server.get(url).expect(404).end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
      });
    });
  });
});
