import fs         from 'fs';
import odata      from 'odata-parser';
import path       from 'path';
import * as ERR   from '../errors';

const parsers = {};

fs.readdirSync(path.join(__dirname, 'query')).forEach(file => {
  const currentPath = path.join(__dirname, 'query', file);
  parsers['$' + file.replace('.js', '')] = require(currentPath);
});

const mapComparators = {
  'ge': 'gte',
  'le': 'lte'
}

// Utility method that given an array of models (or multilevel models),
// it returns an object, removing duplicates and nesting elements
// ['A/B', A/D', 'C'] => {'A': {'B': {}, 'D': {}}, 'C': {}}
const normalizeExpand = expand => {
  return expand.reduce((result, current) => {
    const aux = current.split('/');
    let next = result;
    aux.forEach(model => {
      next[model] = next[model] || {};
      next = next[model];
    });
    return result;
  }, {});
};

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
  let type = mapComparators[parsedFilter.type] || parsedFilter.type;
  let result = {};
  let value = {};

  if (parsedFilter.type === 'eq') {
    value = literal
  } else {
    value[type] = literal;
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
    // XXX odata-parser does not fully support SensorThings OData language.
    req.odata = {};
    Object.keys(req.query).forEach(k => {
      Object.assign(req.odata, odata.parse(k + '=' + req.query[k]));
    });

    if (req.odata && req.odata.$filter) {
      req.odata.$filter = getFilter(req.odata.$filter);
    }

    if (req.odata && req.odata.$expand) {
      req.normalizedExpand = normalizeExpand(req.odata.$expand);
    }
  } catch(e) {
    return ERR.ApiError(res, 400, ERR.ERRNO_INVALID_QUERY_STRING,
                        ERR.BAD_REQUEST, e);
  }

  next();
}
