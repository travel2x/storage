export const errorSchema = {
  $id: 'errorSchema',
  type: 'object',
  properties: {
    status_code: { type: 'string' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['status_code', 'error', 'message'],
} as const
