import { ReactiveVar } from 'meteor/reactive-var'
import './verificationLockOverlay.html'
import './verificationLockOverlay.css'

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
})