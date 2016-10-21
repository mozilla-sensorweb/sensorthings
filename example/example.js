const express      = require('express');
const SensorThings = require('../dist/sensorthings');

var app = express();

const config = {
  db: {
    host: 'localhost',
    port: 5432,
    name: 'sensorthingsexample',
    user: 'postgres',
    pass: '12345678'
  }
};

app.use('/', SensorThings(config));

app.listen(8080, () => console.log('Running on localhost:8080'));
