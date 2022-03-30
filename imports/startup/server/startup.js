import { AccountsAnonymous } from 'meteor/faburem:accounts-anonymous'
import Extensions from '../../api/extensions/extensions.js'
import { defaultSettings, Globalsettings } from '../../api/globalsettings/globalsettings.js'

Meteor.startup(() => {
  AccountsAnonymous.init()
  for (const setting of defaultSettings) {
    if (!Globalsettings.findOne({ name: setting.name })) {
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

  if (process.env.RESET_OIDC === 'true') {
    ServiceConfiguration.configurations.remove({
      service: 'oidc',
    })
    // eslint-disable-next-line no-console, i18next/no-literal-string
    console.log('Reset oidc configuration')
  }

  if (process.env.NODE_ENV !== 'development') {
    // eslint-disable-next-line no-console
    console.log(`titra started on port ${process.env.PORT}`)
  }
})
