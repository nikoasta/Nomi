import { handlePortalRequest } from '../../server/portalApiHandler.js'

export default function handler(req, res) {
  const action = typeof req.query.action === 'string' ? req.query.action : ''
  return handlePortalRequest(req, res, ['model-catalog', action])
}
