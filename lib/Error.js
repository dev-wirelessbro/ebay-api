const ExtendableError = require("es6-error");

exports.NoAuthTokenError = class NoAuthTokenError extends ExtendableError {
  constructor(
    msg = "No token can be found for this user. please create it correctlly"
  ) {
    super(msg);
  }
};

exports.NotSupportedEnvError = class NotSupportedEnvError extends ExtendableError {
  constructor(env) {
    super(
      `The input env ${env} is not supported, only support [sandbox, production]`
    );
  }
};

exports.InvalidAuthNAuthConfigError = class InvalidAuthNAuthConfigError extends ExtendableError {
  constructor(appConfig) {
    super(`The appConfig provide for AuthNAuth is not valid ${appConfig}`);
  }
};

exports.NotSupportedAuthTypeError = class NotSupportedAuthTypeError extends ExtendableError {
  constructor(authType) {
    super(
      `The authType ${authType} is not support, we support [OAUTH, AUTHNAUTH]`
    );
  }
};

exports.InvalidOptionsError = class InvalidOptionsError extends ExtendableError {
  constructor(options) {
    super(`the options is invalid ${JSON.stringify(options)}`);
  }
};

exports.EbayAPIError = class EbayAPIError extends ExtendableError {
  constructor(error) {
    super(error);
  }
};

exports.ExpiredTokenError = class ExpiredTokenError extends ExtendableError {
  constructor(oldDate) {
    super(`The token ${oldDate} is expired`);
  }
};

exports.RequestEbayError = class RequestEbayError extends ExtendableError {
  constructor(json) {
    let errorText;
    let error240
    if (Array.isArray(json.Errors)) {
      errorText = json.Errors.filter(error => error.SeverityCode === 'Error').map(error => {
        if (error.ErrorCode == "240") {
          error240 = error.ErrorParameters instanceof Array ? error.ErrorParameters[0].Value : error.ErrorParameters.Value
        }
        return error.LongMessage
      }).join();
    } else {
      errorText = json.Errors.LongMessage;
    }
    let errMsg = `The reply from ebay is failure ${errorText}`
    if (error240) {
      errMsg = `${errorText} | ${error240}` 
    }
    super(`${errMsg}`);
  }
};

const throws = Object.keys(exports).reduce((thrower, err) => {
  if (err === "throws") return thrower;
  const cstr = exports[err];
  thrower[err] = function _thrower() {
    throw new cstr(...arguments);
  };
  return thrower;
}, {});

module.exports = {
  ...exports,
  throws
};
