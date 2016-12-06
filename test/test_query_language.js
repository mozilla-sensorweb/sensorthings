/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global before */

'use strict';

import app        from './server';
import db         from '../src/models/db';
import should     from 'should';
import supertest  from 'supertest';

import * as CONST from './constants';
import * as ERR   from '../src/errors';

db().then(models => {
  describe('Query language', () => {

    const port        = 8123;
    const server      = supertest.agent(app.listen(port));
    const limit       = CONST.limit;
    const prepath     = '/v1.0/';
    const fullPrepath = 'http://127.0.0.1:' + port + prepath;
    const modelName   = 'Things';

    const get = endpoint => {
      return new Promise(resolve => {
        server.get(prepath + endpoint)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          resolve(res.body);
        });
      });
    };

    const getError = (endpoint, error) => {
      return new Promise(resolve => {
        server.get(prepath + endpoint)
        .expect('Content-Type', /json/)
        .expect(error.code)
        .end((err, res) => {
          should.not.exist(err);
          should.not.exist(res.body[CONST.nextLink]);
          res.body.should.be.deepEqual(error);
          resolve();
        });
      });
    };

    const insert = (count, done) => {
      const model = models[modelName];
      const entity = Object.assign({}, CONST[modelName + 'Entity']);
      let promises = [];
      model.destroy({ where: {} }).then(() => {
        for (let i = 0; i < count; i++) {
          promises.push(model.create(entity));
        }
        Promise.all(promises).then(() => {
          done()
        });
      });
    };

    describe('$top and $skip', () => {
      const topSkipLimit = 302;

      before(done => {
        insert(topSkipLimit, done);
      });

      [{
        top: undefined,
        expected: limit,
        nextLink: {
          top: limit,
          skip: limit
        }
      }, {
        top: 50,
        expected: 50,
        nextLink: {
          top: 50,
          skip: 50
        }
      }, {
        top: 101,
        expected: limit,
        nextLink: {
          top: limit,
          skip: limit
        }
      }].forEach(test => {
        const query = test.top ? '?$top=' + test.top : '';
        it('GET ' + modelName + query +
           ' should respond with ' + test.expected + ' entities',
           done => {
          get(modelName + query)
          .then(result => {
            result[CONST.iotCount].should.be.equal(topSkipLimit);
            result.value.should.be.instanceof(Array).and.have.lengthOf(
              test.expected);
            const nextLink = fullPrepath + modelName +
                             '?$top=' + test.nextLink.top +
                             '&$skip=' + test.nextLink.skip;
            result[CONST.iotNextLink].should.be.equal(nextLink);
            done();
          });
        });
      });

      it('GET ' + modelName + '?$top=-1 should respond with 400 BAD_REQUEST',
         done => {
        getError(modelName + '?$top=-1', {
          code: 400,
          errno: ERR.errnos[ERR.ERRNO_INVALID_QUERY_STRING],
          error: ERR.errors[ERR.BAD_REQUEST],
          message: '$top'
        }).then(() => {
          done()
        });
      });
    });

    describe('$count', () => {
      const count = 10;

      before(done => {
        insert(count, done);
      });

      it('should respond with count', done => {
        get(modelName + '?$count=true')
        .then(result => {
          result[CONST.iotCount].should.be.equal(count);
          done();
        });
      });

      // XXX OData parser. $count is not supported.
      xit('should respond without count', done => {
        get(modelName + '?$count=false')
        .then(result => {
          should.not.exist(result[CONST.iotCount]);
          done();
        });
      });
    });
  });
});
