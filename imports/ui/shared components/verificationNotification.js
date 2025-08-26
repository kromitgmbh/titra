import { ReactiveVar } from 'meteor/reactive-var'
import './verificationNotification.html'
import './verificationNotification.css'

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
    return status && status.required && !status.completed
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
