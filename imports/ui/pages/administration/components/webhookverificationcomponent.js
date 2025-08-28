import './webhookverificationcomponent.html'
import WebhookVerification from '../../../../api/webhookverification/webhookverification.js'
import { showToast } from '../../../../utils/frontend_helpers.js'
import { t } from '../../../../utils/i18n.js'

Template.webhookverificationcomponent.onCreated(function webhookverificationcomponentCreated() {
  this.subscribe('webhookverification')
})

Template.webhookverificationcomponent.helpers({
  webhookVerificationInterfaces: () => WebhookVerification.find(),
})

Template.webhookverificationcomponent.events({
  'click .js-add-webhook-verification': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#name').val()
    const description = templateInstance.$('#description').val()
    const allowedDomains = templateInstance.$('#allowedDomains').val()
    const processData = templateInstance.$('#processData').val()
    const active = templateInstance.$('#isActive').is(':checked')
    
    if (!name || !description || !allowedDomains) {
      showToast(t('notifications.fields_required'))
      return
    }

    Meteor.call('webhookverification.insert', {
      name,
      description,
      allowedDomains,
      processData: processData || `// Process webhook data
// Available variables: webhookData, senderDomain
// Return an object with: { action: 'complete' | 'revoke', userId: 'string' }

// Example for Stripe webhooks:
if (webhookData.type === 'checkout.session.completed') {
  return {
    action: 'complete',
    userId: webhookData.data.object.client_reference_id
  }
} else if (webhookData.type === 'customer.subscription.deleted') {
  return {
    action: 'revoke', 
    userId: webhookData.data.object.metadata.client_reference_id
  }
}

// Return null to ignore this webhook
return null`,
      active,
    }, (error) => {
      if (error) {
        console.error(error)
        showToast(error.reason)
      } else {
        showToast(t('notifications.success'))
        templateInstance.$('form').trigger('reset')
      }
    })
  },
  'click .js-update-webhook-verification': (event, templateInstance) => {
    event.preventDefault()
    const _id = templateInstance.$('#_id').val()
    const name = templateInstance.$('#name').val()
    const description = templateInstance.$('#description').val()
    const allowedDomains = templateInstance.$('#allowedDomains').val()
    const processData = templateInstance.$('#processData').val()
    const active = templateInstance.$('#isActive').is(':checked')
    
    if (!name || !description || !allowedDomains || !processData) {
      showToast(t('notifications.fields_required'))
      return
    }

    Meteor.call('webhookverification.update', {
      _id,
      name,
      description,
      allowedDomains,
      processData,
      active,
    }, (error) => {
      if (error) {
        console.error(error)
        showToast(error.reason)
      } else {
        showToast(t('notifications.success'))
        templateInstance.$('form').trigger('reset')
        templateInstance.$('.js-add-webhook-verification').removeClass('d-none')
        templateInstance.$('.js-update-webhook-verification').addClass('d-none')
      }
    })
  },
  'click .js-edit-webhook-verification': (event, templateInstance) => {
    event.preventDefault()
    const interfaceId = templateInstance.$(event.currentTarget).data('interface-id')
    const webhookInterface = WebhookVerification.findOne({ _id: interfaceId })
    
    if (webhookInterface) {
      templateInstance.$('#_id').val(webhookInterface._id)
      templateInstance.$('#name').val(webhookInterface.name)
      templateInstance.$('#description').val(webhookInterface.description)
      templateInstance.$('#allowedDomains').val(webhookInterface.allowedDomains)
      templateInstance.$('#processData').val(webhookInterface.processData)
      templateInstance.$('#isActive').prop('checked', webhookInterface.active)
      templateInstance.$('.js-add-webhook-verification').addClass('d-none')
      templateInstance.$('.js-update-webhook-verification').removeClass('d-none')
    }
  },
  'click .js-remove-webhook-verification': (event, templateInstance) => {
    event.preventDefault()
    const interfaceId = templateInstance.$(event.currentTarget).data('interface-id')
    
    if (confirm(t('administration.confirm_delete'))) {
      Meteor.call('webhookverification.remove', { _id: interfaceId }, (error) => {
        if (error) {
          console.error(error)
          showToast(error.reason)
        } else {
          showToast(t('notifications.success'))
        }
      })
    }
  },
  'click .js-reset': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('form').trigger('reset')
    templateInstance.$('.js-add-webhook-verification').removeClass('d-none')
    templateInstance.$('.js-update-webhook-verification').addClass('d-none')
  },
})