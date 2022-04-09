import { ServiceConfiguration } from 'meteor/service-configuration'
import { getGlobalSetting } from './frontend_helpers'

const SERVICE_NAME = 'oidc'

const oidcFields = [
  { property: 'clientId', label: 'Client ID' },
  { property: 'secret', label: 'Client Secret' },
  { property: 'serverUrl', label: 'OIDC Server URL' },
  { property: 'authorizationEndpoint', label: 'Authorization Endpoint' },
  { property: 'tokenEndpoint', label: 'Token Endpoint' },
  { property: 'userinfoEndpoint', label: 'Userinfo Endpoint' },
  { property: 'idTokenWhitelistFields', label: 'Id Token Fields' },
]

function isOidcConfigured() {
  if (getGlobalSetting('enableOpenIDConnect')) {
    return ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME }) !== undefined
  }
  return false
}

function getOidcConfiguration(name) {
  if (getGlobalSetting('enableOpenIDConnect')) {
    return ServiceConfiguration.configurations.findOne({ service: SERVICE_NAME })[name]
  }
  return ''
}
export { oidcFields, isOidcConfigured, getOidcConfiguration }
