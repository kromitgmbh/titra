import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import './settings.html'
import '../components/backbutton.js'

Template.settings.onCreated(function settingsCreated() {
  this.displayHoursToDays = new ReactiveVar()
  this.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      if (Meteor.user().profile) {
        this.displayHoursToDays.set(Meteor.user().profile.timeunit === 'd')
      }
    }
  })
})
Template.settings.onRendered(function settingsRendered() {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
        && Meteor.user().profile && this.subscriptionsReady()) {
      templateInstance.$('#timeunit').val(Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : 'h')
      templateInstance.$('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd')
      templateInstance.$('#dailyStartTime').val(Meteor.user().profile.dailyStartTime ? Meteor.user().profile.dailyStartTime : '09:00')
      templateInstance.$('#breakStartTime').val(Meteor.user().profile.breakStartTime ? Meteor.user().profile.breakStartTime : '12:00')
      templateInstance.$('#breakDuration').val(Meteor.user().profile.breakDuration ? Meteor.user().profile.breakDuration : 0.5)
      templateInstance.$('#regularWorkingTime').val(Meteor.user().profile.regularWorkingTime ? Meteor.user().profile.regularWorkingTime : 8)
    }
  })
})

Template.settings.helpers({
  unit() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.unit ? Meteor.user().profile.unit : '$'
    }
    return false
  },
  dailyStartTime: () => (Meteor.user() ? Meteor.user().profile.dailyStartTime : '09:00'),
  breakStartTime: () => (Meteor.user() ? Meteor.user().profile.breakStartTime : '12:00'),
  breakDuration: () => (Meteor.user() ? Meteor.user().profile.breakDuration : 1),
  regularWorkingTime: () => (Meteor.user() ? Meteor.user().profile.regularWorkingTime : 8),

  precision() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.precision ? Meteor.user().profile.precision : '2'
    }
    return false
  },
  timetrackview() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : 'd'
    }
    return false
  },
  hoursToDays() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8
    }
    return false
  },
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile ? Meteor.user().profile.enableWekan : false
    }
    return false
  },
  siwappurl: () => (Meteor.user() ? Meteor.user().profile.siwappurl : false),
  siwapptoken: () => (Meteor.user() ? Meteor.user().profile.siwapptoken : false),
  titraAPItoken: () => (Meteor.user() ? Meteor.user().profile.APItoken : false),
})


Template.settings.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('updateSettings', {
      unit: templateInstance.$('#unit').val(),
      precision: Number(templateInstance.$('#precision').val()),
      timeunit: templateInstance.$('#timeunit').val(),
      timetrackview: templateInstance.$('#timetrackview').val(),
      hoursToDays: Number(templateInstance.$('#hoursToDays').val()),
      dailyStartTime: templateInstance.$('#dailyStartTime').val(),
      breakStartTime: templateInstance.$('#breakStartTime').val(),
      breakDuration: templateInstance.$('#breakDuration').val(),
      regularWorkingTime: templateInstance.$('#regularWorkingTime').val(),
      enableWekan: templateInstance.$('#enableWekan').is(':checked'),
      siwapptoken: templateInstance.$('#siwapptoken').val(),
      siwappurl: templateInstance.$('#siwappurl').val(),
      APItoken: templateInstance.$('#titraAPItoken').val(),
    },
    (error) => {
      if (error) {
        $.notify({ message: i18next.t(error.error) }, { type: 'danger' })
      } else {
        $.notify(i18next.t('notifications.settings_saved_success'))
        templateInstance.$('#imagePreview').hide()
      }
    })
  },
  'click #generateToken': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#titraAPItoken').val(Random.id())
  },
  'change #timeunit': (event, templateInstance) => {
    Template.instance().displayHoursToDays.set(
      templateInstance.$('#timeunit').val() === 'd',
    )
  },
})
