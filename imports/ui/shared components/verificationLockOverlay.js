import { ReactiveVar } from 'meteor/reactive-var'
import './verificationLockOverlay.html'
import './verificationLockOverlay.css'
import { getGlobalSetting } from '../../utils/frontend_helpers.js'
import { t } from '../../utils/i18n.js'

Template.verificationLockOverlay.onCreated(function verificationLockOverlayCreated() {
  this.verificationStatus = new ReactiveVar(null)
  this.verificationUrl = new ReactiveVar(null)

  // Check verification status every 30 seconds to detect changes
  const checkStatus = () => {
    if (Meteor.user()) {
      Meteor.call('getUserVerificationStatus', (error, result) => {
        if (!error && result) {
          this.verificationStatus.set(result)

          // Get verification URL if user is overdue and verification is required
          if (result.required && !result.completed && result.overdue) {
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

  // Check every 30 seconds
  this.statusInterval = Meteor.setInterval(checkStatus, 30000)
})

Template.verificationLockOverlay.onDestroyed(function verificationLockOverlayDestroyed() {
  if (this.statusInterval) {
    Meteor.clearInterval(this.statusInterval)
  }
})

Template.verificationLockOverlay.helpers({
  showLockOverlay() {
    const status = Template.instance().verificationStatus.get()
    // Show lock overlay if verification is required, not completed, and overdue
    return status && status.required && !status.completed && status.overdue
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
      return t('verification.continue_to_default') // Default: "Continue to Verification"
    }
    
    // Check if it's a predefined type with specific translation
    const continueKey = `verification.continue_to_${type}`
    const translated = t(continueKey)
    
    // If translation exists and is different from the key, use it
    if (translated !== continueKey) {
      return translated
    }
    
    // Otherwise use the custom string with default prefix
    const customType = type.charAt(0).toUpperCase() + type.slice(1)
    return t('verification.continue_to_default').replace('Verification', customType)
  },

  lockTitle() {
    const instance = Template.instance()
    
    // Get verification type
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
      return t('verification.account_locked_default')
    }
    
    // Check if it's a predefined type with specific translation
    const titleKey = `verification.account_locked_${type}`
    const translated = t(titleKey)
    
    // If translation exists and is different from the key, use it
    if (translated !== titleKey) {
      return translated
    }
    
    // Otherwise use the custom string with default title
    const customType = type.charAt(0).toUpperCase() + type.slice(1)
    return t('verification.account_locked_default').replace('Verification', customType)
  },
})