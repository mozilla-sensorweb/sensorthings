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

    const server   = supertest.agent(app);
    const limit    = CONST.limit;
    const prepath  = '/v1.0/';

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
          res.body.should.be.deepEqual(error);
          resolve();
        });
      });
    };

    describe('$top and $skip', () => {

      const modelName = 'Things';
      const topSkipLimit = 102;

      before(done => {
        const model = models[modelName];
        const entity = Object.assign({}, CONST[modelName + 'Entity']);
        let promises = [];
        model.destroy({ where: {} }).then(() => {
          for (let i = 0; i < topSkipLimit; i++) {
            promises.push(model.create(entity));
          }
          Promise.all(promises).then(() => {
            done()
          });
        });
      });

      [{
        top: undefined,
        expected: limit
      }, {
        top: 50,
        expected: 50
      }, {
        top: 101,
        expected: limit
      }].forEach(test => {
        const query = test.top ? '?$top=' + test.top : '';
        it('GET ' + modelName + query +
           ' should respond with ' + test.expected + ' entities',
           done => {
          get(modelName + query, test.expected === undefined)
          .then(result => {
            result[CONST.iotCount].should.be.equal(test.expected);
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

      it('GET ' + modelName + '?$skip=' + limit + ' should respond with ' +
         (topSkipLimit - limit) + ' entities',
         done => {
        get(modelName + '?$skip=' + limit)
        .then(result => {
          result[CONST.iotCount].should.be.equal(2);
          done();
        });
      });
    });
  });
});
