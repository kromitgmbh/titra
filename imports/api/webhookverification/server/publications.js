import { Meteor } from 'meteor/meteor'
import WebhookVerification from '../webhookverification.js'

Meteor.publish('webhookverification', function webhookverificationpublication() {
  if (!this.userId || !Meteor.users.findOne({ _id: this.userId }).isAdmin) {
    return this.ready()
  }
  return WebhookVerification.find()
})