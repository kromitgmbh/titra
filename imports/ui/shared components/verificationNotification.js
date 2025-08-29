import { ReactiveVar } from 'meteor/reactive-var'
import './verificationNotification.html'
import './verificationNotification.css'
import { getGlobalSetting } from '../../../utils/frontend_helpers.js'
import { t } from '../../../utils/i18n.js'

Template.verificationNotification.onCreated(function verificationNotificationCreated() {
  this.verificationStatus = new ReactiveVar(null)
  this.verificationUrl = new ReactiveVar(null)
  this.dismissed = new ReactiveVar(false)

  // Check verification status every minute
  const checkStatus = () => {
    if (Meteor.user()) {
      Meteor.call('getUserVerificationStatus', (error, result) => {
        if (!error && result) {
          this.verificationStatus.set(result)

          // Get verification URL if needed
          if (result.required && !result.completed) {
            Meteor.call('getUserVerificationUrl', (urlError, url) => {
              if (!urlError && url) {
                this.verificationUrl.set(url)
              }
            })
          }
        }
      })
    }
  }

  // Initial check
  checkStatus()

  // Check every minute
  this.statusInterval = Meteor.setInterval(checkStatus, 60000)
})

Template.verificationNotification.onDestroyed(function verificationNotificationDestroyed() {
  if (this.statusInterval) {
    Meteor.clearInterval(this.statusInterval)
  }
})

Template.verificationNotification.helpers({
  showNotification() {
    const status = Template.instance().verificationStatus.get()
    // Show notification if verification is required, not completed, but NOT overdue
    // (overdue cases are handled by the lock overlay)
    return status && status.required && !status.completed && !status.overdue
  },

  dismissed() {
    return Template.instance().dismissed.get()
  },

  overdue() {
    const status = Template.instance().verificationStatus.get()
    return status && status.overdue
  },

  daysRemaining() {
    const status = Template.instance().verificationStatus.get()
    return status ? status.daysRemaining : 0
  },

  verificationUrl() {
    return Template.instance().verificationUrl.get()
  },

  verificationType() {
    const instance = Template.instance()
    
    // Get verification type from reactive variable or call method if not cached
    if (!instance.verificationType) {
      instance.verificationType = new ReactiveVar('')
      Meteor.call('webhookverification.getdefaulttype', (error, result) => {
        if (!error) {
          instance.verificationType.set(result || '')
        }
      })
    }
    
    const type = instance.verificationType.get()
    if (!type) {
      return t('verification.complete_action') // Default: "Complete Action"
    }
    
    // Check if it's a predefined type with translation
    const translationKey = `verification.type_${type}`
    const translated = t(translationKey)
    
    // If translation exists and is different from the key, use translated term
    if (translated !== translationKey) {
      return `Complete ${translated}`
    }
    
    // Otherwise use the custom string as-is (capitalize first letter)
    const customType = type.charAt(0).toUpperCase() + type.slice(1)
    return `Complete ${customType}`
  },
})

Template.verificationNotification.events({
  'click .js-dismiss-notification': function dismissNotification(event, templateInstance) {
    event.preventDefault()
    templateInstance.dismissed.set(true)

    // Auto-show again after 1 hour
    Meteor.setTimeout(() => {
      templateInstance.dismissed.set(false)
    }, 3600000) // 1 hour
  },
})
