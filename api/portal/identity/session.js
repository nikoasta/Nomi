import { handlePortalRequest } from '../../../server/portalApiHandler.js'

export default function handler(req, res) {
  return handlePortalRequest(req, res, ['identity', 'session'])
}
