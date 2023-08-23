import { OAuth } from 'meteor/oauth'
import { Random } from 'meteor/random'
import { ServiceConfiguration } from 'meteor/service-configuration'
import { Base64 } from 'meteor/base64'

const hasOwn = Object.prototype.hasOwnProperty

const ILLEGAL_PARAMETERS = {
  response_type: 1,
  client_id: 1,
  scope: 1,
  redirect_uri: 1,
  state: 1,
}

// Request Google credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
const requestCredential = async (optionsParam) => new Promise((resolve, reject) => {
  // support both (options, callback) and (callback).
  let options = optionsParam
  if (!options) {
    if (!options) {
      options = {}
    }
  }
  const config = ServiceConfiguration.configurations.findOne({ service: 'googleapi' })
  if (!config) {
    reject(new ServiceConfiguration.ConfigError())
    return
  }

  const credentialToken = Random.secret()

  const scopes = ['https://www.googleapis.com/auth/calendar.events.readonly', 'https://www.googleapis.com/auth/gmail.readonly']

  const loginUrlParameters = {}
  if (config.loginUrlParameters) {
    Object.assign(loginUrlParameters, config.loginUrlParameters)
  }
  if (options.loginUrlParameters) {
    Object.assign(loginUrlParameters, options.loginUrlParameters)
  }

  // validate options keys
  Object.keys(loginUrlParameters).forEach((key) => {
    if (hasOwn.call(ILLEGAL_PARAMETERS, key)) {
      throw new Error(`Google.requestCredential: Invalid loginUrlParameter: ${key}`)
    }
  })

  // backwards compatible options
  if (options.requestOfflineToken != null) {
    loginUrlParameters.access_type = options.requestOfflineToken ? 'offline' : 'online'
  }
  if (options.prompt != null) {
    loginUrlParameters.prompt = options.prompt
  } else if (options.forceApprovalPrompt) {
    loginUrlParameters.prompt = 'consent'
  }

  if (options.loginHint) {
    loginUrlParameters.login_hint = options.loginHint
  }

  const loginStyle = OAuth._loginStyle('googleapi', config, options)
  // https://developers.google.com/accounts/docs/OAuth2WebServer#formingtheurl

  const state = {
    loginStyle,
    credentialToken,
    isCordova: Meteor.isCordova,
    userId: Meteor.userId(),
  }

  if (loginStyle === 'redirect'
      || (Meteor.settings?.public?.packages?.oauth?.setRedirectUrlWhenLoginStyleIsPopup && loginStyle === 'popup')
  ) {
    state.redirectUrl = options.redirectUrl || (`${window.location}`)
  }

  // Encode base64 as not all login services URI-encode the state
  // parameter when they pass it back to us.
  // Use the 'base64' package here because 'btoa' isn't supported in IE8/9.
  const encodedState = Base64.encode(JSON.stringify(state))
  Object.assign(loginUrlParameters, {
    response_type: 'code',
    client_id: config.clientId,
    scope: scopes.join(' '), // space delimited
    redirect_uri: OAuth._redirectUri('googleapi', config),
    state: encodedState,
  })
  const loginUrl = `https://accounts.google.com/o/oauth2/auth?${
    Object.keys(loginUrlParameters).map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`).join('&')}`

  OAuth.launchLogin({
    loginService: 'googleapi',
    loginStyle,
    loginUrl,
    credentialRequestCompleteCallback: (credentialTokenParam) => {
      resolve(credentialTokenParam)
    },
    credentialToken,
    popupOptions: { height: 600 },
  })
})

const googleAPI = async (optionsParam) => {
  const options = optionsParam
  if (!Meteor.user().profile.googleAPIexpiresAt
    || Meteor.user().profile.googleAPIexpiresAt < Date.now()) {
    const credentialToken = await requestCredential(options)
    return credentialToken
  }
  return 'already authenticated'
}

Meteor.googleAPI = googleAPI
export { googleAPI }
