/* eslint-disable i18next/no-literal-string */
import { Meteor } from 'meteor/meteor'
import { OAuth } from 'meteor/oauth'
import { ServiceConfiguration } from 'meteor/service-configuration'

const SERVICE_NAME = 'oidc'

let userAgent = 'Meteor'
if (Meteor.release) {
  userAgent += `/${Meteor.release}`
}

async function getConfiguration() {
  const config = await(ServiceConfiguration.configurations.findOneAsync({ service: SERVICE_NAME }))
  if (!config) {
    throw new ServiceConfiguration.ConfigError('Service oidc not configured.')
  }
  return config
}

async function getToken(query) {
  const config = await getConfiguration()
  const serverTokenEndpoint = `${config.serverUrl}${config.tokenEndpoint}`
  let response

  try {
    response = await fetch(serverTokenEndpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri(SERVICE_NAME, config),
        grant_type: 'authorization_code',
        state: query.state,
      })
    })
  } catch (err) {
    const error = new Error(`Failed to get token from OIDC ${serverTokenEndpoint}: ${err.message}`)
    error.response = err.response
    throw error
  }
  if (response.data.error) {
    // if the http response was a json object with an error attribute
    throw new Error(`Failed to complete handshake with OIDC ${serverTokenEndpoint}: ${response.data.error}`)
  } else {
    return response.data
  }
}

async function getUserInfoFromEndpoint(accessToken, config, expiresAt) {
  const serverUserinfoEndpoint = `${config.serverUrl}${config.userinfoEndpoint}`
  let response
  try {
    response = await fetch(serverUserinfoEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  } catch (err) {
    const error = new Error(`Failed to fetch userinfo from OIDC ${serverUserinfoEndpoint}: ${err.message}`)
    error.response = err.response
    throw error
  }

  const userinfo = response.data
  return {
    id: userinfo.id || userinfo.sub,
    username: userinfo.username || userinfo.preferred_username,
    accessToken: OAuth.sealSecret(accessToken),
    expiresAt,
    email: userinfo.email,
    name: userinfo.name,
  }
}

function getTokenContent(token) {
  let content = null
  if (token) {
    try {
      const parts = token.split('.')
      content = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } catch (err) {
      content = {
        exp: 0,
      }
    }
  }
  return content
}

function getUserInfoFromToken(accessToken) {
  const tokenContent = getTokenContent(accessToken)
  const mainEmail = tokenContent.email || tokenContent.emails[0]

  return {
    id: tokenContent.sub,
    username: tokenContent.username || tokenContent.preferred_username || mainEmail,
    accessToken: OAuth.sealSecret(accessToken),
    expiresAt: tokenContent.exp,
    email: mainEmail,
    name: tokenContent.name,
  }
}

async function getUserInfo(accessToken, expiresAt) {
  const config = await getConfiguration()

  if (config.userinfoEndpoint) {
    return await getUserInfoFromEndpoint(accessToken, config, expiresAt)
  }
  return getUserInfoFromToken(accessToken)
}

async function registerOidc() {
  Accounts.oauth.registerService(SERVICE_NAME)
  OAuth.registerService(SERVICE_NAME, 2, null, async (query) => {
    const token = await getToken(query)
    const accessToken = token.access_token || token.id_token
    const expiresAt = (+new Date()) + (1000 * parseInt(token.expires_in, 10))
    const userinfo = await getUserInfo(accessToken, expiresAt)
    const serviceData = {
      id: userinfo.id,
      username: userinfo.username,
      accessToken: userinfo.accessToken,
      expiresAt: userinfo.expiresAt,
      email: userinfo.email,
    }
    if (accessToken) {
      const tokenContent = getTokenContent(accessToken)
      const config = await getConfiguration()
      config.idTokenWhitelistFields.forEach((key) => {
        serviceData[key] = tokenContent[key]
      })
    }
    if (token.refresh_token) {
      serviceData.refreshToken = token.refresh_token
    }
    const profile = {
      name: userinfo.name,
    }
    const email = {
      address: userinfo.email,
      verified: true,
    }
    return {
      serviceData,
      options: { profile, emails: [email] },
    }
  })
}
export { registerOidc }
