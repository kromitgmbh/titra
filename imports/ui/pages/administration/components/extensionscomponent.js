import './extensionscomponent.html'
import Extensions from '../../../../api/extensions/extensions'
import { showToast } from '../../../../utils/frontend_helpers'
import { t } from '../../../../utils/i18n'

Template.extensionscomponent.onCreated(function extensionscomponentCreated() {
  this.subscribe('extensions')
})
Template.extensionscomponent.helpers({
  extensions: () => (Extensions.find({}).fetch().length > 0 ? Extensions.find({}) : false),
})
Template.extensionscomponent.events({
  'change #extensionFile': (event) => {
    event.preventDefault()
    const file = event.currentTarget.files[0]
    const reader = new FileReader()
    if (file && reader) {
      reader.readAsDataURL(file)
      reader.onload = () => {
        const zipFile = reader.result
        Meteor.call('addExtension', { zipFile }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            showToast(t(result))
          }
        })
      }
    }
  },
  'click .js-remove-extension': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('removeExtension', { extensionId: templateInstance.$(event.currentTarget).data('extension-id') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('administration.extension_removed'))
      }
    })
  },
  'click .js-launch-extension': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('launchExtension', { extensionId: templateInstance.$(event.currentTarget).data('extension-id') }, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t(result))
      }
    })
  },
  'change .js-extension-state': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('toggleExtensionState', { extensionId: templateInstance.$(event.currentTarget).data('extension-id'), state: templateInstance.$(event.currentTarget).is(':checked') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.success'))
      }
    })
  },
})
