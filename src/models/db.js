/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import fs        from 'fs';
import path      from 'path';
import Sequelize from 'sequelize';

let db = null;

module.exports = config => {
  if (db) {
    return db;
  }

  const { name, user, pass, host, port } = config;
  if (!name || !user || !pass || !host || !port) {
    throw new Error('Missing or malformed DB config');
  }

  const sequelize = new Sequelize(name, user, pass, {
    host,
    port,
    dialect: 'postgres'
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

  return db;
};
