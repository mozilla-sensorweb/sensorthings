const express      = require('express');
const sensorthings = require('../dist/sensorthings');

var app = express();

app.use('/', sensorthings);

app.listen(8080, () => console.log('Running on localhost:8080'));
