import './oidccomponent.html'
import { oidcFields, getOidcConfiguration } from '../../../../utils/oidc_helper'
import { showToast } from '../../../../utils/frontend_helpers'
import { t } from '../../../../utils/i18n.js'

Template.oidccomponent.helpers({
  oidcSettings: () => oidcFields,
  oidcValue: (name) => getOidcConfiguration(name),
  siteUrl: () => Meteor.absoluteUrl({ replaceLocalhost: true }),
})
Template.oidccomponent.events({
  'click .js-update-oidc': (event) => {
    event.preventDefault()
    const configuration = {
      service: 'oidc',
      loginStyle: 'popup',
    }
    // Fetch the value of each input field
    oidcFields.forEach((field) => {
      configuration[field.property] = document.getElementById(
        `configure-oidc-${field.property}`,
      ).value.replace(/^\s*|\s*$/g, '') // trim() doesnt work on IE8
    })
    configuration.idTokenWhitelistFields = configuration.idTokenWhitelistFields.split(' ')
    // Configure this login service
    Meteor.call('updateOidcSettings', configuration, (error) => {
      if (error) {
        // eslint-disable-next-line no-underscore-dangle
        Meteor._debug('Error configuring login service oidc', error)
      } else {
        showToast(t('notifications.success'))
      }
    })
  },
})
