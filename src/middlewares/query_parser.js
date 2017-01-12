import fs         from 'fs';
import odata      from 'odata-parser';
import path       from 'path';
import * as ERR   from '../errors';

const parsers = {};

fs.readdirSync(path.join(__dirname, 'query')).forEach(file => {
  const currentPath = path.join(__dirname, 'query', file);
  parsers['$' + file.replace('.js', '')] = require(currentPath);
});

const getFilter = parsedFilter => {
  if (!parsedFilter) {
    return {};
  }

  // At the moment, we only support 'Property + Comparission Op + literal'
  if (!parsedFilter.left || parsedFilter.left.type !== 'property') {
    return {};
  }

  if (!parsedFilter.right || parsedFilter.right.type !== 'literal') {
    return {};
  }

  let literal = parsedFilter.right.value;
  let result = {};
  let value = {};

  if (parsedFilter.type === 'eq') {
    value = literal
  } else {
    value[parsedFilter.type] = literal;
  }

  result[parsedFilter.left.name] = value;
  return result;
}

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
    if (req.odata && req.odata.$filter) {
      req.odata.$filter = getFilter(req.odata.$filter);
    }
  } catch(e) {
    return ERR.ApiError(res, 400, ERR.ERRNO_INVALID_QUERY_STRING,
                        ERR.BAD_REQUEST, e);
  }

  next();
}
