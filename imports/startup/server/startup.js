import { defaultSettings, Globalsettings } from '../../api/globalsettings/globalsettings.js'

Meteor.startup(() => {
  for (const setting of defaultSettings) {
    if (!Globalsettings.findOne({ name: setting.name })) {
      Globalsettings.insert(setting)
    }
  }
})
