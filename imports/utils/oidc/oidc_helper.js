import { ServiceConfiguration } from 'meteor/service-configuration'
import { getGlobalSetting } from '../frontend_helpers.js'

const SERVICE_NAME = 'oidc'

const oidcFields = [
  {
    property: 'disableDefaultLoginForm', label: 'Disable Default Login Form', type: 'checkbox', value: false,
  },
  {
    property: 'clientId', label: 'Client ID', type: 'text', value: '',
  },
  {
    property: 'secret', label: 'Client Secret', type: 'text', value: '',
  },
  {
    property: 'serverUrl', label: 'OIDC Server URL', type: 'text', value: '',
  },
  {
    property: 'authorizationEndpoint', label: 'Authorization Endpoint', type: 'text', value: '',
  },
  {
    property: 'tokenEndpoint', label: 'Token Endpoint', type: 'text', value: '',
  },
  {
    property: 'userinfoEndpoint', label: 'Userinfo Endpoint', type: 'text', value: '',
  },
  {
    property: 'idTokenWhitelistFields', label: 'Id Token Fields', type: 'text', value: '',
  },
  {
    property: 'requestPermissions', label: 'Request Permissions', type: 'text', value: '"openid", "profile", "email"',
  },
]

function isOidcConfigured() {
  if (getGlobalSetting('enableOpenIDConnect')) {
    return ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME }) !== undefined
  }
  return false
}

function disableDefaultLoginForm() {
  if (!getGlobalSetting('enableOpenIDConnect')) {
    return false
  }

  const configuration = ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME })
  if (configuration === undefined) {
    return false
  }

  return configuration.disableDefaultLoginForm
}

function getOidcConfiguration(name) {
  if (getGlobalSetting('enableOpenIDConnect')) {
    return ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME })
      ? ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME })[name] : false
  }
  return ''
}
export {
  oidcFields, isOidcConfigured, disableDefaultLoginForm, getOidcConfiguration,
}
