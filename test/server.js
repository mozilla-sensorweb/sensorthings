import bodyParser       from 'body-parser';
import express          from 'express';
import SensorThings     from '../src/sensorthings';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const config = {
  db: {
    host: 'localhost',
    port: 5432,
    name: 'sensorthingstest',
    user: 'postgres',
    pass: '12345678'
  }
};

app.use('/', SensorThings(config));

const port = 8080;
app.listen(port);

exports = module.exports = app;
