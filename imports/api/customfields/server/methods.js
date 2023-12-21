import { ValidatedMethod } from 'meteor/mdg:validated-method'
import CustomFields from '../customfields.js'
import { Globalsettings } from '../../globalsettings/globalsettings.js'
import { adminAuthenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers'

/**
  Adds a new custom field to the CustomFields collection.
  @param {Object} options - The options object containing the custom field information.
  @param {string} options.classname - The classname of the custom field.
  @param {string} options.name - The name of the custom field.
  @param {string} options.desc - The description of the custom field.
  @param {string} options.type - The type of the custom field.
  @param {string[]} [options.possibleValues] - An array of possible values for the custom field.
  @throws {Meteor.Error} If the custom field already exists or the user is not an admin.
  @return {Object} The custom field object that was added to the collection.
*/
const addCustomField = new ValidatedMethod({
  name: 'addCustomField',
  validate(args) {
    check(args, {
      classname: String,
      name: String,
      type: String,
      desc: String,
      possibleValues: Match.Maybe([String]),
      category: Match.Maybe(String),
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    classname, name, desc, type, possibleValues, category,
  }) {
    if (await CustomFields.findOneAsync({ name })) {
      throw new Meteor.Error('error-custom-field-exists', 'Custom field already exists', { method: 'addCustomField' })
    }
    if (classname === 'global_setting' && await Globalsettings.findOneAsync({ name })) {
      throw new Meteor.Error('error-global-setting-exists', 'Global setting already exists', { method: 'addCustomField' })
    }
    const customField = {
      classname,
      name,
      desc,
      type,
      possibleValues,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await CustomFields.insertAsync(customField)
    const globalsetting = {
      name,
      description: desc,
      category,
      type,
    }
    if (classname === 'global_setting') {
      await Globalsettings.insertAsync(globalsetting)
    }
    return customField
  },
})
/**
  @function removeCustomField
  @async
  @param {Object} options - An object containing the id of the custom field to remove
  @param {string} options._id - The id of the custom field to remove
  @throws {Error} If the user is not an admin or if the custom field is not found
  @returns {boolean} - returns true if the custom field is removed successfully
  */
const removeCustomField = new ValidatedMethod({
  name: 'removeCustomField',
  validate(args) {
    check(args, {
      _id: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ _id }) {
    const customfield = await CustomFields.findOneAsync({ _id })
    if (!customfield) {
      throw new Meteor.Error('error-custom-field-not-found', 'Custom field not found', { method: 'removeCustomField' })
    }
    if (customfield.classname === 'global_setting') {
      await Globalsettings.removeAsync({ name: customfield.name })
    }
    await CustomFields.removeAsync({ _id })
    return true
  },
})
/**
  @function updateCustomField
  @async
  @param {Object} options - An object containing the details of the custom field to update
  @param {string} options._id - The id of the custom field to update.
  @param {string} options.desc - The description of the custom field.
  @param {string} options.type - The type of the custom field.
  @param {string[]} [options.possibleValues] - The possible values of the custom field.
  @throws {Error} If the user is not an admin or if the custom field is not found
  @returns {boolean} - returns true if the custom field is updated successfully
  */
const updateCustomField = new ValidatedMethod({
  name: 'updateCustomField',
  validate(args) {
    check(args, {
      _id: String,
      type: String,
      desc: String,
      possibleValues: Match.Maybe([String]),
      category: Match.Maybe(String),
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    _id, desc, type, possibleValues, category,
  }) {
    const customfield = await CustomFields.findOneAsync({ _id })
    if (!customfield) {
      throw new Meteor.Error('error-custom-field-not-found', 'Custom field not found', { method: 'removeCustomField' })
    }
    await CustomFields.updateAsync(
      { _id },
      {
        $set: {
          desc, type, possibleValues, category, updatedAt: new Date(),
        },
      },
    )
    if (customfield.classname === 'global_setting') {
      await Globalsettings.updateAsync({ name: customfield.name }, {
        $set: {
          description: desc,
          type,
          category,
        },
      })
    }
    return true
  },
})

export { addCustomField, removeCustomField, updateCustomField }
