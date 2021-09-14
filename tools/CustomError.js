const { JsonWebTokenError } = require("jsonwebtoken");

function Unauthorized(message = "Unauthorized") {
  this.name = "Unauthorized";
  this.status = 401;
  this.message = message;
}

Unauthorized.prototype = Error.prototype;

function BadRequest(message = "Bad Request") {
  this.name = "BadRequest";
  this.status = 400;
  this.message = message;
}

BadRequest.prototype = Error.prototype;

function NotFound(message = "Not found.") {
  this.name = "NotFound";
  this.status = 404;
  this.message = message;
}

NotFound.prototype = Error.prototype;

function ServerError(message = "Something wrong at backend.") {
  this.name = "ServerError";
  this.status = 500;
  this.message = message;
}

ServerError.prototype = Error.prototype;

function DBError(err, from = "") {
  let error;
  switch (err.code) {
    case "23505":
      error = err.detail.split(" ");
      error = error[1].split("=");
      error = `${error[0]} is already exist.`;
      this.status = 400;
      break;
    default:
      this.status = 500;
  }
  this.name = "DBError";
  this.message = {
    type: "database",
    from: from,
    code: err.code,
    detail: error ? error : err.detail,
    full_error: err,
  };
}

DBError.prototype = Error.prototype;

function handleResponse(err) {
  if (err instanceof JsonWebTokenError) {
    return {
      status: 401,
      error: "Unauthorized.",
    };
  } else if (err instanceof Unauthorized) {
    return {
      status: err.status,
      error: err.message,
    };
  } else if (err instanceof BadRequest) {
    return {
      status: err.status,
      error: err.message,
    };
  } else if (err instanceof NotFound) {
    return {
      status: err.status,
      error: err.message,
    };
  } else if (err instanceof DBError) {
    return {
      status: err.status,
      error: err.message,
    };
  } else if (err instanceof ServerError) {
    return {
      status: err.status,
      error: err.message,
    };
  } else {
    //CASE: Server error
    console.error(err);
    return {
      status: 500,
      error: {
        type: "server",
        stack: err.stack,
      },
    };
  }
}

module.exports = {
  Unauthorized,
  BadRequest,
  NotFound,
  ServerError,
  DBError,
  handleResponse,
};
