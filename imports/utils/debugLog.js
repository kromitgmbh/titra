import { getGlobalSetting } from './frontend_helpers.js'
import { getGlobalSettingAsync } from './server_method_helpers.js'

export async function debugLog(...args) {
  let setting
  if (Meteor.isClient) {
    setting = getGlobalSetting('debugMode')
  } else if (Meteor.isServer) {
    setting = await getGlobalSettingAsync('debugMode')
  }
  if (setting && (setting.value === true || setting.value === 'true')) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]', ...args)
  }
}
