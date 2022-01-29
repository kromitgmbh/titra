import CustomFields from '../customfields.js'
import { checkAuthentication } from '../../../utils/server_method_helpers'

Meteor.methods({
  addCustomField: function addCustomField({
    classname, name, desc, type, possibleValues,
  }) {
    check(classname, String)
    check(name, String)
    check(type, String)
    check(desc, String)
    check(possibleValues, Match.Maybe([String]))
    checkAuthentication(this)
    if (CustomFields.findOne({ name })) {
      throw new Meteor.Error('error-custom-field-exists', 'Custom field already exists', { method: 'addCustomField' })
    }
    const customField = {
      classname,
      name,
      desc,
      type,
      possibleValues,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    CustomFields.insert(customField)
    return customField
  },
  removeCustomField: function removeCustomField({ _id }) {
    check(_id, String)
    checkAuthentication(this)
    if (!CustomFields.findOne({ _id })) {
      throw new Meteor.Error('error-custom-field-not-found', 'Custom field not found', { method: 'removeCustomField' })
    }
    CustomFields.remove({ _id })
  },
  updateCustomField: function updateCustomField({
    _id, desc, type, possibleValues,
  }) {
    checkAuthentication(this)
    check(_id, String)
    check(type, String)
    check(desc, String)
    check(possibleValues, Match.Maybe([String]))
    if (!CustomFields.findOne({ _id })) {
      throw new Meteor.Error('error-custom-field-not-found', 'Custom field not found', { method: 'removeCustomField' })
    }
    CustomFields.update(
      { _id },
      {
        $set: {
          desc, type, possibleValues, updatedAt: new Date(),
        },
      },
    )
  },
})
