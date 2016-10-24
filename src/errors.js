// errno
const errnos = {
  ERRNO_INTERNAL_ERROR: 500,
  ERRNO_BAD_REQUEST: 400,
  ERRNO_RESOURCE_NOT_FOUND: 404
};

exports.errnos = errnos;

// Error messages.
const errors = {
  INTERNAL_ERROR: 'Internal Server Error',
  BAD_REQUEST   : 'Bad Request',
  NOT_FOUND     : 'Resource Not Found'
};

exports.errors = errors;

// Model errors.
const modelErrors = {};
exports.modelErrors = modelErrors;

exports.ApiError = (res, code, errno, error, message) => {
  if (!res) {
    throw new Error('Missing response object');
  }

  if (!errnos[errno]) {
    throw new Error('Invalid errno');
  }

  if (!errors[error]) {
    throw new Error('Invalid error');
  }

  return res.status(code).send({
    code,
    errno: errnos[errno],
    error: errors[error],
    message
  });
};

[errnos, errors, modelErrors].forEach(object => {
  Object.keys(object).forEach(key => exports[key] = key);
});
