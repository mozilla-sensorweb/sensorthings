// errno
const errnos = {};
exports.errnos = errnos;

// Error messages.
const errors = {};
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
