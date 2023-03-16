import './customfieldscomponent.html'
import CustomFields from '../../../../api/customfields/customfields.js'
import { t } from '../../../../utils/i18n.js'
import { showToast } from '../../../../utils/frontend_helpers'

Template.customfieldscomponent.onCreated(function customfieldscomponentCreated() {
  this.subscribe('customfields')
  this.editCustomFieldId = new ReactiveVar()
})

Template.customfieldscomponent.events({
  'click .js-create-customfield': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#customfieldName').val().replace(/[^A-Z0-9]/ig, '_')
    const desc = templateInstance.$('#customfieldDesc').val()
    const type = templateInstance.$('#customfieldType').val()
    const classname = templateInstance.$('#customfieldClassname').val()
    const possibleValues = templateInstance.$('#customfieldPossibleValues').val() !== '' ? templateInstance.$('#customfieldPossibleValues').val().split(',') : undefined
    const category = templateInstance.$('#customfieldCategory').val()
    if (!name) {
      templateInstance.$('#customfieldName').addClass('is-invalid')
      return
    }
    if (!desc) {
      templateInstance.$('#customfieldDesc').addClass('is-invalid')
      return
    }
    if (!type) {
      templateInstance.$('#customfieldType').addClass('is-invalid')
      return
    }
    if (!classname) {
      templateInstance.$('#customfieldClassname').addClass('is-invalid')
      return
    }
    templateInstance.$('.form-control').removeClass('is-invalid')
    Meteor.call('addCustomField', {
      name,
      desc,
      type,
      classname,
      possibleValues,
      category
    }, (error) => {
      if (error) {
        console.error(error)
      } else {
        templateInstance.$('#customfieldName').val('')
        templateInstance.$('#customfieldDesc').val('')
        templateInstance.$('#customfieldClassname').val('')
        showToast(t('notifications.success'))
      }
    })
  },
  'click .js-remove-customfield': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('removeCustomField', {
      _id: templateInstance.$(event.currentTarget).data('customfield-id'),
    }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.success'))
      }
    })
  },
  'click .js-edit-customfield': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.editCustomFieldId.set(templateInstance.$(event.currentTarget).data('customfield-id'))
    const customField = CustomFields.findOne({ _id: templateInstance.$(event.currentTarget).data('customfield-id') })
    if (customField) {
      templateInstance.$('#editCustomfieldClassname').val(customField.classname)
      templateInstance.$('#editCustomfieldName').val(customField.name)
      templateInstance.$('#editCustomfieldDesc').val(customField.desc)
      templateInstance.$('#editCustomfieldType').val(customField.type)
      templateInstance.$('#editCustomfieldPossibleValues').val(customField.possibleValues)
      templateInstance.$('#editCustomfieldCategory').val(customField.category)
    }
  },
  'click .js-update-customfield': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('updateCustomField', {
      _id: templateInstance.editCustomFieldId.get(),
      desc: templateInstance.$('#editCustomfieldDesc').val(),
      type: templateInstance.$('#editCustomfieldType').val(),
      category: templateInstance.$('#editCustomfieldCategory').val(),
      possibleValues: templateInstance.$('#editCustomfieldPossibleValues').val() !== '' ? templateInstance.$('#editCustomfieldPossibleValues').val().split(',') : undefined,
    }, (error) => {
      if (error) {
        console.error(error)
      } else {
        templateInstance.editCustomFieldId.set('')
        templateInstance.$('.js-edit-customfield-modal').modal('hide')
        showToast(t('notifications.success'))
      }
    })
  },
})
Template.customfieldscomponent.helpers({
  getClassName: (name) => t(`globals.${name}`),
  customfields: () => (CustomFields.find({}).fetch().length > 0 ? CustomFields.find({}) : false),
})
