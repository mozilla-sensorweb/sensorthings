# SensorThings API
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/mozilla-sensorweb/sensorthings/master/LICENSE)
[![Build Status](https://travis-ci.org/mozilla-sensorweb/sensorthings.svg?branch=master)](https://travis-ci.org/mozilla-sensorweb/sensorthings)
[![Coverage Status](https://coveralls.io/repos/github/mozilla-sensorweb/sensorthings/badge.svg)](https://coveralls.io/github/mozilla-sensorweb/sensorthings)

Node implementation of the OGC SensorThings API.

# Dependencies
* Nodejs 6
* PostgreSQL >9.4

# Build
```shell
npm install
npm run build
```

# Usage
```js
const express      = require('express');
const SensorThings = require('../dist/sensorthings'); // or require('sensorthings')
                                                      // if you installed it via npm

var app = express();

const config = {
  db: {
    host: 'localhost',
    port: 5432,
    name: 'sensorweb',
    user: 'postgres',
    pass: '12345678'
  }
};

app.use('/', SensorThings(config));

app.listen(8080, () => console.log('Running on localhost:8080'));
```

# Running the tests

```shell
npm run test-watch
```

# Running the example

```shell
npm run example
```
