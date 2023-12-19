import { getConfig } from '@/config'
import jwt from 'jsonwebtoken'

const { isMultitenant, jwtSecret, jwtAlgorithm } = getConfig()
interface jwtInterface {
  sub?: string
  role?: string
}

export type SignedToken = {
  url: string
  transformations?: string
  exp: number
}

export async function getJwtSecret(tenantId?: string): Promise<string> {
  let secret = jwtSecret
  if (isMultitenant) {
    // secret = await getJwtSecretForTenant(tenantId)
  }
  return secret
}

export function verifyJWT<T>(token: string, secret: string): Promise<jwt.JwtPayload & T> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, { algorithms: [jwtAlgorithm as jwt.Algorithm] }, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded as jwt.JwtPayload & T)
    })
  })
}

export function signJWT(
  payload: string | object | Buffer,
  secret: string,
  expiresIn: string | number
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      secret,
      { expiresIn, algorithm: jwtAlgorithm as jwt.Algorithm },
      (err, token) => {
        if (err) return reject(err)
        resolve(token)
      }
    )
  })
}

export async function getOwner(token: string, secret: string): Promise<string | undefined> {
  const decodedJWT = await verifyJWT(token, secret)
  return (decodedJWT as jwtInterface)?.sub
}

export async function getRole(token: string, secret: string): Promise<string | undefined> {
  const decodedJWT = await verifyJWT(token, secret)
  return (decodedJWT as jwtInterface)?.role
}
