import { defaultSettings, Globalsettings } from './globalsettings.js'
import { checkAdminAuthentication } from '../../utils/server_method_helpers.js'

Meteor.methods({
  async updateGlobalSettings(settingsArray) {
    await checkAdminAuthentication(this)
    check(settingsArray, Array)
    for (const setting of settingsArray) {
      check(setting, Object)
      check(setting.name, String)
      check(setting.value, Match.OneOf(String, Number, Boolean))
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.updateAsync({ name: setting.name }, { $set: { value: setting.value } })
    }
  },
  async resetSettings() {
    await checkAdminAuthentication(this)
    for (const setting of defaultSettings) {
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.removeAsync({ name: setting.name })
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.insertAsync(setting)
    }
  },
  async resetGlobalsetting({ name }) {
    await checkAdminAuthentication(this)
    Globalsettings.remove({ name })
    for (const setting of defaultSettings) {
      if (setting.name === name) {
        // eslint-disable-next-line no-await-in-loop
        await Globalsettings.insertAsync(setting)
        break
      }
    }
  },
  async updateOidcSettings(configuration) {
    check(configuration, Object)
    await checkAdminAuthentication(this)
    await ServiceConfiguration.configurations.removeAsync({
      service: 'oidc',
    })
    await ServiceConfiguration.configurations.insertAsync(configuration)
  },
  async getGlobalsettingCategories() {
    await checkAdminAuthentication(this)
    return Globalsettings.rawCollection().aggregate([{ $group: { _id: '$category' } }, { $sort: { _id: 1 } }]).toArray()
  },
})
