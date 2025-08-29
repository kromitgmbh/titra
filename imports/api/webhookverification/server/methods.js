import { check, Match } from 'meteor/check'
import { NodeVM } from 'vm2'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import {
  adminAuthenticationMixin, authenticationMixin, transactionLogMixin, getGlobalSettingAsync,
} from '../../../utils/server_method_helpers'
import WebhookVerification from '../webhookverification.js'

/**
 * Method for inserting a new webhook verification interface.
 *
 * @method webhookverificationinsert
 * @param {Object} options - The options for inserting a new webhook verification interface.
 * @param {string} options.name - The name of the webhook verification interface.
 * @param {string} options.description - The description of the webhook verification interface.
 * @param {string} options.allowedDomains - Comma-separated list of allowed domains.
 * @param {string} [options.processData] - The process data code for parsing webhooks.
 * @param {boolean} options.active - The active status of the webhook verification interface.
 * @returns {string} - The success notification message.
 */
const webhookverificationinsert = new ValidatedMethod({
  name: 'webhookverification.insert',
  validate({
    name, description, allowedDomains, verificationPeriod, serviceUrl, urlParam, verificationType, processData, active,
  }) {
    check(name, String)
    check(description, String)
    check(allowedDomains, String)
    check(verificationPeriod, Match.Maybe(Number))
    check(serviceUrl, Match.Maybe(String))
    check(urlParam, Match.Maybe(String))
    check(verificationType, Match.Maybe(String))
    check(processData, Match.Maybe(String))
    check(active, Boolean)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    name, description, allowedDomains, verificationPeriod, serviceUrl, urlParam, verificationType, processData, active,
  }) {
    await WebhookVerification.insertAsync({
      name,
      description,
      allowedDomains,
      verificationPeriod: verificationPeriod || 30,
      serviceUrl: serviceUrl || '',
      urlParam: urlParam || 'client_reference_id',
      verificationType: verificationType || '',
      processData,
      active,
    })
    return 'notifications.success'
  },
})

/**
 * Updates a webhook verification interface.
 *
 * @method webhookverificationupdate
 * @param {Object} options - The options for updating the webhook verification interface.
 * @param {string} options._id - The ID of the webhook verification interface.
 * @param {string} options.name - The name of the webhook verification interface.
 * @param {string} options.description - The description of the webhook verification interface.
 * @param {string} options.allowedDomains - Comma-separated list of allowed domains.
 * @param {string} options.processData - The process data code for parsing webhooks.
 * @param {boolean} options.active - The active status of the webhook verification interface.
 * @returns {string} - The success notification message.
 */
const webhookverificationupdate = new ValidatedMethod({
  name: 'webhookverification.update',
  validate({
    _id,
    name,
    description,
    allowedDomains,
    verificationPeriod,
    serviceUrl,
    urlParam,
    verificationType,
    processData,
    active,
  }) {
    check(_id, String)
    check(name, String)
    check(description, String)
    check(allowedDomains, String)
    check(verificationPeriod, Match.Maybe(Number))
    check(serviceUrl, Match.Maybe(String))
    check(urlParam, Match.Maybe(String))
    check(verificationType, Match.Maybe(String))
    check(processData, String)
    check(active, Boolean)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    _id,
    name,
    description,
    allowedDomains,
    verificationPeriod,
    serviceUrl,
    urlParam,
    verificationType,
    processData,
    active,
  }) {
    await WebhookVerification.updateAsync({ _id }, {
      $set: {
        name,
        description,
        allowedDomains,
        verificationPeriod: verificationPeriod || 30,
        serviceUrl: serviceUrl || '',
        urlParam: urlParam || 'client_reference_id',
        verificationType: verificationType || '',
        processData,
        active,
      },
    })
    return 'notifications.success'
  },
})

/**
 * Removes a webhook verification interface.
 *
 * @method webhookverificationremove
 * @param {Object} options - The options for removing the webhook verification interface.
 * @param {string} options._id - The ID of the webhook verification interface to be removed.
 * @returns {string} - A success notification message.
 */
const webhookverificationremove = new ValidatedMethod({
  name: 'webhookverification.remove',
  validate({ _id }) {
    check(_id, String)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ _id }) {
    await WebhookVerification.removeAsync({ _id })
    return 'notifications.success'
  },
})

/**
 * Retrieves the active webhook verification interfaces.
 *
 * @method webhookverification.get
 * @mixes authenticationMixin
 * @returns {Array} An array of active webhook verification interfaces.
 */
const getWebhookVerification = new ValidatedMethod({
  name: 'webhookverification.get',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return WebhookVerification
      .find({ active: true }, { fields: { processData: 0 } }).fetchAsync()
  },
})

/**
 * Process webhook data using the configured webhook verification interface.
 *
 * @method webhookverification.process
 * @param {Object} options - The options for processing webhook data.
 * @param {string} options._id - The ID of the webhook verification interface.
 * @param {Object} options.webhookData - The webhook payload data.
 * @param {string} options.senderDomain - The domain of the webhook sender.
 * @throws {Meteor.Error} If there is an error processing the webhook.
 * @returns {Object} The processed webhook result.
 */
const processWebhookVerification = new ValidatedMethod({
  name: 'webhookverification.process',
  validate({ _id, webhookData, senderDomain }) {
    check(_id, String)
    check(webhookData, Object)
    check(senderDomain, String)
  },
  async run({ _id, webhookData, senderDomain }) {
    const webhookInterface = await WebhookVerification.findOneAsync({ _id, active: true })
    
    if (!webhookInterface) {
      throw new Meteor.Error('Webhook verification interface not found or inactive')
    }

    // Check if sender domain is allowed
    const allowedDomains = webhookInterface.allowedDomains.split(',').map(d => d.trim())
    if (!allowedDomains.includes(senderDomain)) {
      throw new Meteor.Error('Domain not whitelisted for webhook verification')
    }

    const vm = new NodeVM({
      wrapper: 'none',
      timeout: 1000,
      sandbox: {
        webhookData,
        senderDomain,
        webhookConfig: {
          verificationPeriod: webhookInterface.verificationPeriod || 30,
          serviceUrl: webhookInterface.serviceUrl || '',
          urlParam: webhookInterface.urlParam || 'client_reference_id',
          verificationType: webhookInterface.verificationType || '',
        },
        getGlobalSettingAsync,
        console,
      },
      require: {
        external: true,
        builtin: ['*'],
      },
    })
    
    try {
      const result = await vm.run(webhookInterface.processData)
      if (!result || typeof result !== 'object') {
        throw new Meteor.Error('Webhook processing must return an object')
      }
      return result
    } catch (error) {
      throw new Meteor.Error(`Webhook processing error: ${error.message}`)
    }
  },
})

/**
 * Get default verification settings for frontend display.
 * Returns the verification type from the first active webhook.
 *
 * @method webhookverification.getdefaulttype
 * @returns {string} The default verification type.
 */
const getDefaultVerificationType = new ValidatedMethod({
  name: 'webhookverification.getdefaulttype',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    const firstWebhook = await WebhookVerification.findOneAsync({ active: true })
    return firstWebhook?.verificationType || ''
  },
})

export {
  webhookverificationinsert,
  webhookverificationupdate,
  webhookverificationremove,
  getWebhookVerification,
  processWebhookVerification,
  getDefaultVerificationType,
}