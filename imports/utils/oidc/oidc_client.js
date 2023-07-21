/* eslint-disable i18next/no-literal-string */
import { OAuth } from 'meteor/oauth'
import { Random } from 'meteor/random'
import { ServiceConfiguration } from 'meteor/service-configuration'

const SERVICE_NAME = 'oidc'

function registerOidc() {
  Accounts.oauth.registerService(SERVICE_NAME)

  Meteor.loginWithOidc = (callback) => {
    const options = {}
    const completeCallback = Accounts.oauth.credentialRequestCompleteHandler(callback)

    const config = ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME })
    if (!config) {
      if (completeCallback) {
        completeCallback(
          new ServiceConfiguration.ConfigError('Service oidc not configured.'),
        )
      }
      return
    }

    const credentialToken = Random.secret()
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent)
    const display = mobile ? 'touch' : 'popup'
    const loginStyle = OAuth._loginStyle(SERVICE_NAME, config, options)
    const scope = config.requestPermissions?.split(',') || ['openid', 'profile', 'email']

    // options
    options.client_id = config.clientId
    options.response_type = 'code'
    options.redirect_uri = OAuth._redirectUri(SERVICE_NAME, config)
    options.state = OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl)
    options.scope = scope.join(' ')

    if (config.loginStyle) {
      options.display = display
    }

    let loginUrl = `${config.serverUrl}${config.authorizationEndpoint}`
    // check if the loginUrl already contains a '?'
    const hasExistingParams = loginUrl.indexOf('?') !== -1

    if (!hasExistingParams) {
      loginUrl += '?'
    } else {
      loginUrl += '&'
    }

    loginUrl += Object.keys(options).map((key) => [key, options[key]].map(encodeURIComponent).join('=')).join('&')

    options.popupOptions = options.popupOptions || {}
    const popupOptions = {
      width: options.popupOptions.width || 320,
      height: options.popupOptions.height || 450,
    }

    OAuth.launchLogin({
      loginService: SERVICE_NAME,
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback: completeCallback,
      credentialToken,
      popupOptions,
    })
  }
}
export { registerOidc }
