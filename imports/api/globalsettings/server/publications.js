import { Globalsettings } from '../globalsettings.js'

Meteor.publish('globalsettings', () => Globalsettings.find())
