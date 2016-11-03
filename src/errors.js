// errno
const errnos = {
  ERRNO_INTERNAL_ERROR      : 500,
  ERRNO_RESOURCE_NOT_FOUND  : 404,
  ERRNO_BAD_REQUEST         : 400,
  ERRNO_VALIDATION_ERROR    : 100
};

exports.errnos = errnos;

// Error messages.
const errors = {
  BAD_REQUEST   : 'Bad Request',
  INTERNAL_ERROR: 'Internal Server Error',
  NOT_FOUND     : 'Not Found'
};

exports.errors = errors;

// Model errors.
const modelErrors = {
  VALIDATION_ERROR: 'SequelizeValidationError'
};
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
