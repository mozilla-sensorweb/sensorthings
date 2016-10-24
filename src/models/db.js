/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import fs        from 'fs';
import path      from 'path';
import Sequelize from 'sequelize';

import {
  NOT_FOUND
} from '../errors';


const IDLE           = 0
const INITIALIZING   = 1;
const READY          = 2;

const Deferred = function Deferred () {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });

  return this;
};

let deferreds = [];

let state = IDLE;
let db    = null;

module.exports = config => {
  if (state === READY) {
    return Promise.resolve(db);
  }

  let deferred = new Deferred();
  deferreds.push(deferred);

  if (state === INITIALIZING) {
    return deferred.promise;
  }

  state = INITIALIZING;

  const { name, user, pass, host, port } = config;

  const sequelize = new Sequelize(name, user, pass, {
    host,
    port,
    dialect: 'postgres',
    logging: false
  });

  db = {};

  fs.readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.js') !== 0) && (file !== 'encoding_types.js');
    })
    .forEach(file => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  // Transaction method that updates an specific model instance and
  // returns the updated object
  db.updateInstance = (model, instanceId, values, excludedFields) => {
    return db.sequelize.transaction(t1 => {
      return db[model].update(values, {
        where: { id: instanceId }
      }, { transaction: t1 }).then(affected => {
        const affectedRows = affected[0];
        if (affectedRows === 1) {
          return db[model].findById(instanceId, {
            attributes: {
              exclude: excludedFields
            },
            transaction: t1
          });
        }

        return new Promise((resolve, reject) => {
          reject({ type: NOT_FOUND });
        })
      });
    });
  };

  return db.sequelize.sync().then(() => {
    while (deferreds.length) {
      deferreds.pop().resolve(db);
    }
    state = READY;

    return db;
  }).catch(err => {
    while (deferreds.length) {
      deferreds.pop().reject(err);
    }
  });
};
