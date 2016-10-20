import bodyParser       from 'body-parser';
import express          from 'express';
import sensorthings     from '../src/sensorthings';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', sensorthings);

const port = 8080;
app.listen(port, () => console.log(`Running on localhost:${port}`));

exports = module.exports = app;
