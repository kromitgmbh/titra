import { AccountsAnonymous } from 'meteor/faburem:accounts-anonymous'
import { NodeVM } from 'vm2'
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
    Globalsettings.update({ name: 'disablePublicProjects' }, { $set: { value: Meteor.settings.disablePublic === 'true' } })
  }
  if (Meteor.settings.enableAnonymousLogins) {
    Globalsettings.update({ name: 'enableAnonymousLogins' }, { $set: { value: Meteor.settings.disablePublic === 'true' } })
  }
  for (const extension of Extensions.find({})) {
    if (extension.isActive) {
      if (extension.id === 'titra_ldap') {
        // extensions should bundle all their dependencies, however this does not work
        // for ldapjs because the maintainer refuses to support transpilation
        import('ldapjs')
      }
      eval(extension.server)
    }
  }
  if (process.env.NODE_ENV !== 'development') {
    console.log(`titra started on port ${process.env.PORT}`)
  }
})
