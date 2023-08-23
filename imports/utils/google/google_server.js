import { fetch } from 'meteor/fetch'
import { OAuth } from 'meteor/oauth'
import { ServiceConfiguration } from 'meteor/service-configuration'

const registerGoogleAPI = () => {
  OAuth.registerService('googleapi', 2, null, async (query) => {
    const { userId } = JSON.parse(Buffer.from(query.state, 'base64').toString('binary'))
    let tokens
    const config = await ServiceConfiguration.configurations.findOneAsync({
      service: 'googleapi',
    })
    if (!config) throw new ServiceConfiguration.ConfigError()
    const content = new URLSearchParams({
      code: query.code,
      client_id: config.clientId,
      client_secret: OAuth.openSecret(config.secret),
      redirect_uri: OAuth._redirectUri('googleapi', config),
      grant_type: 'authorization_code',
    })
    const request = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: content,
    })
    const response = await request.json()
    if (response.error) {
      // if the http response was a json object with an error attribute
      throw new Meteor.Error(
        `Failed to complete OAuth handshake with Google. ${response.error}`,
      )
    } else {
      const data = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        idToken: response.id_token,
      }
      tokens = data
    }
    const { accessToken, idToken } = tokens
    let scopes
    try {
      const scopeContent = new URLSearchParams({ access_token: accessToken })
      let scopeResponse
      try {
        const scopeRequest = await fetch(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?${scopeContent.toString()}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          },
        )
        scopeResponse = await scopeRequest.json()
      } catch (e) {
        throw new Meteor.Error(e.reason)
      }
      scopes = scopeResponse.scope.split(' ')
    } catch (err) {
      const error = Object.assign(
        new Error(`Failed to fetch tokeninfo from Google. ${err.message}`),
        { response: err.response },
      )
      throw error
    }
    const serviceData = {
      id: userId,
      accessToken,
      idToken,
      scope: scopes,
    }
    if (Object.prototype.hasOwnProperty.call(tokens, 'expiresIn')) {
      serviceData.expiresAt = Date.now() + 1000 * parseInt(tokens.expiresIn, 10)
    }
    // only set the token in serviceData if it's there. this ensures
    // that we don't lose old ones (since we only get this on the first
    // log in attempt)
    if (tokens.refreshToken) {
      serviceData.refreshToken = tokens.refreshToken
    }
    const returnValue = {
      serviceData,
    }
    await Meteor.users.updateAsync({ _id: userId }, { $set: { 'services.googleapi': returnValue, 'profile.googleAPIexpiresAt': serviceData.expiresAt } })
    return { serviceData: {} }
  })
}
export default registerGoogleAPI
