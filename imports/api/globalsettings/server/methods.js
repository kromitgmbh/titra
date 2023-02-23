import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { defaultSettings, Globalsettings } from '../globalsettings.js'
import { adminAuthenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers.js'

/**
@summary Updates global settings
@param {Array} settingsArray - Array of settings to update
@throws {Meteor.Error} If user is not an administrator
@returns {String} 'notifications.success' if successful
*/
const updateGlobalSettings = new ValidatedMethod({
  name: 'updateGlobalSettings',
  validate(settingsArray) {
    check(settingsArray, Array)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run(settingsArray) {
    for (const setting of settingsArray) {
      check(setting, Object)
      check(setting.name, String)
      check(setting.value, Match.OneOf(String, Number, Boolean))
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.updateAsync({ name: setting.name }, { $set: { value: setting.value } })
    }
  },
})
/**
@summary Resets all the global settings to their default values
*/
const resetSettings = new ValidatedMethod({
  name: 'resetSettings',
  validate: null,
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run() {
    for (const setting of defaultSettings) {
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.removeAsync({ name: setting.name })
      // eslint-disable-next-line no-await-in-loop
      await Globalsettings.insertAsync(setting)
    }
  },
})
/**
Reset global setting with a specified name
@param {Object} options
@param {string} options.name - Name of the global setting to be reset
*/
const resetGlobalsetting = new ValidatedMethod({
  name: 'resetGlobalsetting',
  validate(args) {
    check(args, {
      name: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ name }) {
    Globalsettings.remove({ name })
    for (const setting of defaultSettings) {
      if (setting.name === name) {
        // eslint-disable-next-line no-await-in-loop
        await Globalsettings.insertAsync(setting)
        break
      }
    }
  },
})
/**
@summary Updates the OIDC settings in the server
@param {Object} configuration - The updated OIDC configuration object
@returns {undefined}
*/
const updateOidcSettings = new ValidatedMethod({
  name: 'updateOidcSettings',
  validate(args) {
    check(args, {
      configuration: Object,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ configuration }) {
    await ServiceConfiguration.configurations.removeAsync({
      service: 'oidc',
    })
    await ServiceConfiguration.configurations.insertAsync(configuration)
  },
})
/**
@summary Get the list of global setting categories.
@returns {Array} An array of global setting categories
@throws {Meteor.Error} If the user is not authorized
*/
const getGlobalsettingCategories = new ValidatedMethod({
  name: 'getGlobalsettingCategories',
  validate: null,
  mixins: [adminAuthenticationMixin],
  async run() {
    return Globalsettings.rawCollection().aggregate([{ $group: { _id: '$category' } }, { $sort: { _id: 1 } }]).toArray()
  },
})

export {
  resetSettings,
  updateOidcSettings,
  getGlobalsettingCategories,
  updateGlobalSettings,
  resetGlobalsetting,
}
