import { checkAuthentication } from '../../../utils/server_method_helpers.js'
import { Globalsettings } from '../globalsettings.js'

Meteor.publish('globalsettings', function globalsettings() {
  checkAuthentication(this)
  return Globalsettings.find()
})
