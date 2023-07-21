import './oidccomponent.html'
import { oidcFields, getOidcConfiguration } from '../../../../utils/oidc/oidc_helper'
import { showToast } from '../../../../utils/frontend_helpers'
import { t } from '../../../../utils/i18n.js'

Template.oidccomponent.helpers({
  oidcSettings: () => oidcFields,
  oidcValue: (name) => getOidcConfiguration(name),
  siteUrl: () => Meteor.absoluteUrl({ replaceLocalhost: true }),
  isCheckbox: (setting) => setting.type === 'checkbox',
  isChecked: (name) => (getOidcConfiguration(name) ? 'checked' : ''),
})
Template.oidccomponent.events({
  'click .js-update-oidc': (event, templateInstance) => {
    event.preventDefault()
    const configuration = {
      service: 'oidc',
      loginStyle: 'popup',
    }
    for (const element of templateInstance.$('.js-setting-input')) {
      const { name } = element
      let value = templateInstance.$(element).val()
      if (element.type === 'checkbox') {
        value = templateInstance.$(element).is(':checked')
      }
      configuration[name] = value
    }
    configuration.idTokenWhitelistFields = configuration.idTokenWhitelistFields.split(' ')
    // Configure this login service
    Meteor.call('updateOidcSettings', { configuration }, (error) => {
      if (error) {
        // eslint-disable-next-line no-underscore-dangle
        Meteor._debug('Error configuring login service oidc', error)
      } else {
        showToast(t('notifications.success'))
      }
    })
  },
})
