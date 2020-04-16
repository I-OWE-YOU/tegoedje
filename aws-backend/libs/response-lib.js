export function success(body) {
  return buildResponse(200, body);
}

export function noContent() {
  return buildResponse(204);
}

export function failure(body) {
  return buildResponse(500, body);
}

export function validationError(body) {
  return buildResponse(422, { errors: body });
}

export function resourceNotFound(body) {
  return buildResponse(404, body);
}

export function redirect(location) {
  return buildResponse(301, null, { Location: location });
}

export function redirectWithError(location, error, errorMsg) {
  const url = `${location}?error=${error}&error_description=${errorMsg}`;
  return redirect(url);
}

export function badRequest(errorMsg) {
  buildResponse(400, { error_description: errorMsg });
}

function buildResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      ...headers
    },
    body: JSON.stringify(body)
  };
}
