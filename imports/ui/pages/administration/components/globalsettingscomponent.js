import './globalsettingscomponent.html'
import { Globalsettings } from '../../../../api/globalsettings/globalsettings.js'
import { t } from '../../../../utils/i18n.js'
import { showToast } from '../../../../utils/frontend_helpers.js'

Template.globalsettingscomponent.onCreated(function globalsettingscomponentCreated() {
  this.globalsettingCategories = new ReactiveVar()
  this.filter = new ReactiveVar()
  this.subscribe('globalsettings')
  Meteor.call('getGlobalsettingCategories', (error, result) => {
    if (!error) {
      this.globalsettingCategories.set(result.map((entry) => entry._id))
    } else {
      console.error(error)
    }
  })
})

Template.globalsettingscomponent.helpers({
  globalsettings: () => Globalsettings.find(),
  getGlobalsettingsForCategory: (category) => Globalsettings
    .find().fetch().sort((a, b) => {
      if (t(a.description) < t(b.description)) {
        return -1
      } if (t(a.description) > t(b.description)) {
        return 1
      }
      return 0
    }).filter((entry) => (category === 'settings.categories.no_category' ? entry.category === undefined : entry.category === category) && (Template.instance().filter.get() ? t(entry.description).match(new RegExp(`.*${Template.instance().filter.get()}.*`, 'gi')) : true)),
  globalsettingCategories: () => Template.instance().globalsettingCategories.get()?.map((entry) => entry || 'settings.categories.no_category'),
  isTextArea: (setting) => setting.type === 'textarea',
  isCheckbox: (setting) => setting.type === 'checkbox',
  isChecked: (setting) => (setting.value.toString() === 'true' ? 'checked' : ''),
  stringify: (string) => string?.toString(),
})

Template.globalsettingscomponent.events({
  'click #reset': (event) => {
    event.preventDefault()
    Meteor.call('resetSettings', (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetGlobalsetting', { name: templateInstance.$(event.currentTarget).data('setting-name') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        Meteor.call('getGlobalsettingCategories', (innerError, result) => {
          if (!innerError) {
            templateInstance.globalsettingCategories.set(result.map((entry) => entry._id))
          } else {
            console.error(error)
          }
        })
        showToast(t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const settingsArray = []
    // eslint-disable-next-line i18next/no-literal-string
    for (const element of templateInstance.$('.js-setting-input')) {
      const { name } = element
      let value = templateInstance.$(element).val()
      if (element.type === 'number') {
        value = Number(value)
      } else if (element.type === 'checkbox') {
        value = templateInstance.$(element).is(':checked')
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      }
      settingsArray.push({ name, value })
    }
    Meteor.call('updateGlobalSettings', settingsArray, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.settings_saved_success'))
      }
    })
  },
  'change .js-globalsetting-search': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.filter.set(templateInstance.$(event.currentTarget).val())
  },
})
