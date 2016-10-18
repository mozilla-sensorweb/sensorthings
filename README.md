# SensorThings API
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](https://raw.githubusercontent.com/sensorweb/sensorthings/master/LICENSE)

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
