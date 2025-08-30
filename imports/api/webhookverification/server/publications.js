import { Meteor } from 'meteor/meteor'
import WebhookVerification from '../webhookverification.js'
import { checkAdminAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('webhookverification', async function webhookverificationpublication() {
  try {
    await checkAdminAuthentication(this)
  } catch (error) {
    return this.ready()
  }
  return WebhookVerification.find()
})