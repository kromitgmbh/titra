import { Globalsettings } from '../globalsettings.js'

/**
 * Publishes the global settings.
 * @returns {Mongo.Cursor} The global settings.
 */
Meteor.publish('globalsettings', () => Globalsettings.find())
