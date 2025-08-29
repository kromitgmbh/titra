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
    const type = getGlobalSetting('userActionVerificationType')
    if (!type) {
      return t('verification.continue_to_verification') // Default: "Continue to Verification"
    }
    
    // Check if it's a predefined type with translation
    const translationKey = `verification.type_${type}`
    const translated = t(translationKey)
    
    // If translation exists and is different from the key, use translated term
    if (translated !== translationKey) {
      return `Continue to ${translated}`
    }
    
    // Otherwise use the custom string as-is (capitalize first letter)
    const customType = type.charAt(0).toUpperCase() + type.slice(1)
    return `Continue to ${customType}`
  },
})