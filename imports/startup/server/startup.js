import { defaultSettings, Globalsettings } from '../../api/globalsettings/globalsettings.js'

Meteor.startup(() => {
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
})
