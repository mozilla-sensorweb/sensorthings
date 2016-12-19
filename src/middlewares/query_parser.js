import fs         from 'fs';
import odata      from 'odata-parser';
import path       from 'path';
import * as ERR   from '../errors';

const parsers = {};

fs.readdirSync(path.join(__dirname, 'query')).forEach(file => {
  const currentPath = path.join(__dirname, 'query', file);
  parsers['$' + file.replace('.js', '')] = require(currentPath);
});

export default (req, res, next) => {
  const queryParams = Object.keys(req.query);
  if (!queryParams.length) {
    return next();
  }

  try {
    queryParams.forEach(param => {
      if (!parsers[param] || !parsers[param].validate(req.query[param])) {
        throw param;
      }
    });
  } catch (param) {
    return ERR.ApiError(res, 400, ERR.ERRNO_INVALID_QUERY_STRING,
                        ERR.BAD_REQUEST, param);
  }

  try {
    const decodedQuery =  decodeURIComponent(req.originalUrl.split('?').pop());
    // XXX odata-parser does not fully support SensorThings OData language.
    req.odata = odata.parse(decodedQuery);
  } catch(e) {
    return ERR.ApiError(res, 400, ERR.ERRNO_INVALID_QUERY_STRING,
                        ERR.BAD_REQUEST, e);
  }

  next();
}
