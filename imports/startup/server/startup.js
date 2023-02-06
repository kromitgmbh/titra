import { AccountsAnonymous } from 'meteor/faburem:accounts-anonymous'
import { BrowserPolicy } from 'meteor/browser-policy-framing'
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter'
import Extensions from '../../api/extensions/extensions.js'
import { defaultSettings, Globalsettings } from '../../api/globalsettings/globalsettings.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

Meteor.startup(async () => {
  AccountsAnonymous.init()
  for await (const setting of defaultSettings) {
    if (!await Globalsettings.findOneAsync({ name: setting.name })) {
      Globalsettings.insert(setting)
    }
  }
  if (Meteor.settings.disablePublic) {
    // eslint-disable-next-line i18next/no-literal-string
    Globalsettings.update({ name: 'disablePublicProjects' }, { $set: { value: Meteor.settings.disablePublic === 'true' } })
  }
  if (Meteor.settings.enableAnonymousLogins) {
    // eslint-disable-next-line i18next/no-literal-string
    Globalsettings.update({ name: 'enableAnonymousLogins' }, { $set: { value: Meteor.settings.disablePublic === 'true' } })
  }
  if (getGlobalSetting('enableOpenIDConnect')) {
    import('../../utils/oidc_server').then((Oidc) => {
      Oidc.registerOidc()
    })
  }
  for (const extension of Extensions.find({})) {
    if (extension.isActive) {
      if (extension.id === 'titra_ldap') {
        // extensions should bundle all their dependencies, however this does not work
        // for ldapjs because the maintainer refuses to support transpilation
        import('ldapjs')
      }
      // eslint-disable-next-line no-eval
      eval(extension.server)
    }
  }
  if (getGlobalSetting('XFrameOptionsOrigin')) {
    BrowserPolicy.framing.restrictToOrigin(getGlobalSetting('XFrameOptionsOrigin'))
  }
  if (process.env.NODE_ENV !== 'development') {
    // eslint-disable-next-line no-console
    console.log(`titra started on port ${process.env.PORT}`)
  }

  // Rate limiting all methods and subscriptions, defaulting to 100 calls per second

  for (const subscription in Meteor.server.publish_handlers) {
    if ({}.hasOwnProperty.call(Meteor.server.publish_handlers, subscription)) {
      DDPRateLimiter.addRule({
        type: 'subscription',
        name: subscription,
      }, 100, 1000)
    }
  }
  for (const method in Meteor.server.method_handlers) {
    if ({}.hasOwnProperty.call(Meteor.server.method_handlers, method)) {
      DDPRateLimiter.addRule({
        type: 'method',
        name: method,
      }, 100, 1000)
    }
  }
})
