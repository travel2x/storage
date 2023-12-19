type BucketResponseType = { message: string; status_code?: string; error?: string }

/**
 * Create generic respose for all buckets
 * @param message {string} Main message
 * @param status {string=} StatusCode
 * @param error {string=} Error number (presented as a string)
 * @return {BucketResponseType} Object with all paramaters
 */
function createResponse(message: string, status?: string, error?: string): BucketResponseType {
  const response: BucketResponseType = {
    message,
  }

  if (status) response.status_code = status;
  if (error) response.error = error;

  return response
}

function createDefaultSchema<S, P>(successResponseSchema: S, properties: P): any {
  return {
    headers: { $ref: 'authSchema#' },
    response: {
      200: { description: 'Successful response', ...successResponseSchema },
      '4xx': { description: 'Error response', $ref: 'errorSchema#' },
    },
    ...properties,
  }
}

export { createResponse, createDefaultSchema }