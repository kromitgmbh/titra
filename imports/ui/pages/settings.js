import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import './settings.html'
import '../components/backbutton.js'
import { getGlobalSetting } from '../../utils/frontend_helpers'

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
      templateInstance.$('#timeunit').val(Meteor.user().profile.timeunit ? Meteor.user().profile.timeunit : getGlobalSetting('timeunit'))
      templateInstance.$('#timetrackview').val(Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : getGlobalSetting('timetrackview'))
      templateInstance.$('#dailyStartTime').val(Meteor.user().profile.dailyStartTime ? Meteor.user().profile.dailyStartTime : getGlobalSetting('dailyStartTime'))
      templateInstance.$('#breakStartTime').val(Meteor.user().profile.breakStartTime ? Meteor.user().profile.breakStartTime : getGlobalSetting('breakStartTime'))
      templateInstance.$('#breakDuration').val(Meteor.user().profile.breakDuration ? Meteor.user().profile.breakDuration : getGlobalSetting('breakDuration'))
      templateInstance.$('#regularWorkingTime').val(Meteor.user().profile.regularWorkingTime ? Meteor.user().profile.regularWorkingTime : getGlobalSetting('regularWorkingTime'))
    }
  })
})

Template.settings.helpers({
  unit() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.unit ? Meteor.user().profile.unit : getGlobalSetting('unit')
    }
    return false
  },
  dailyStartTime: () => (Meteor.user() ? Meteor.user().profile.dailyStartTime : getGlobalSetting('dailyStartTime')),
  breakStartTime: () => (Meteor.user() ? Meteor.user().profile.breakStartTime : getGlobalSetting('breakStartTime')),
  breakDuration: () => (Meteor.user() ? Meteor.user().profile.breakDuration : getGlobalSetting('breakDuration')),
  regularWorkingTime: () => (Meteor.user() ? Meteor.user().profile.regularWorkingTime : getGlobalSetting('regularWorkingTime')),
  precision() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.precision ? Meteor.user().profile.precision : getGlobalSetting('precision')
    }
    return false
  },
  timetrackview() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.timetrackview ? Meteor.user().profile.timetrackview : getGlobalSetting('timetrackview')
    }
    return false
  },
  hoursToDays() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : getGlobalSetting('hoursToDays')
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
  'click .js-reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetUserSettings', (error) => {
      if (error) {
        console.error(error)
      } else {
        $.notify(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
})
