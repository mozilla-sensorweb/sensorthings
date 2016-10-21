# SensorThings API
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/sensorweb/sensorthings/master/LICENSE)
[![Build Status](https://travis-ci.org/mozilla-sensorweb/sensorthings.svg?branch=master)](https://travis-ci.org/mozilla-sensorweb/sensorthings)
[![Coverage Status](https://coveralls.io/repos/github/mozilla-sensorweb/sensorthings/badge.svg)](https://coveralls.io/github/mozilla-sensorweb/sensorthings)

Node implementation of the OGC SensorThings API.

# Build
```shell
npm run build
```

# Usage
```js
const express      = require('express');
const sensorthings = require('../dist/sensorthings'); // or require('sensorthings') if you installed it via npm

var app = express();

app.use('/', sensorthings);

app.listen(8080, () => console.log('Running on localhost:8080'));
```

# Running the tests

```shell
npm run test-watch
```
