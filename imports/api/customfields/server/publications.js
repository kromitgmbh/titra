import { check } from 'meteor/check'
import CustomFields from '../customfields.js'

Meteor.publish('customfields', () => CustomFields.find({}))

Meteor.publish('customfieldsForClass', ({ classname }) => {
  check(classname, String)
  return CustomFields.find({ classname })
})
