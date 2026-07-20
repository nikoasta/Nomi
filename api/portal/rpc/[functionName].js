import { handlePortalRequest } from '../../../server/portalApiHandler.js'

export default function handler(req, res) {
  const functionName = typeof req.query.functionName === 'string' ? req.query.functionName : ''
  return handlePortalRequest(req, res, ['rpc', functionName])
}
