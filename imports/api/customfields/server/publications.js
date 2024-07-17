import { check } from 'meteor/check'
import CustomFields from '../customfields.js'
/**
 * Publishes the custom fields.
 * @returns {Mongo.Cursor} The custom fields.
 */
Meteor.publish('customfields', () => CustomFields.find({}))
/**
 * Publishes the custom fields for a class.
 * @param {String} classname The class name.
 * @returns {Mongo.Cursor} The custom fields for the class.
 */
Meteor.publish('customfieldsForClass', ({ classname }) => {
  check(classname, String)
  return CustomFields.find({ classname })
})
