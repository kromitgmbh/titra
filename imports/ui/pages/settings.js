import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import './settings.html'
import '../components/backbutton.js'
import { getGlobalSetting, getUserSetting } from '../../utils/frontend_helpers'

Template.settings.onCreated(function settingsCreated() {
  this.displayHoursToDays = new ReactiveVar()
  this.autorun(() => {
    this.displayHoursToDays.set(getUserSetting('timeunit') === 'd')
  })
})
Template.settings.onRendered(function settingsRendered() {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (!Meteor.loggingIn() && Meteor.user()
        && Meteor.user().profile && this.subscriptionsReady()) {
      templateInstance.$('#timeunit').val(getUserSetting('timeunit') ? getUserSetting('timeunit') : getGlobalSetting('timeunit'))
      templateInstance.$('#timetrackview').val(getUserSetting('timetrackview') ? getUserSetting('timetrackview') : getGlobalSetting('timetrackview'))
      templateInstance.$('#dailyStartTime').val(getUserSetting('dailyStartTime') ? getUserSetting('dailyStartTime') : getGlobalSetting('dailyStartTime'))
      templateInstance.$('#breakStartTime').val(getUserSetting('breakStartTime') ? getUserSetting('breakStartTime') : getGlobalSetting('breakStartTime'))
      templateInstance.$('#breakDuration').val(getUserSetting('breakDuration') ? getUserSetting('breakDuration') : getGlobalSetting('breakDuration'))
      templateInstance.$('#regularWorkingTime').val(getUserSetting('regularWorkingTime') ? getUserSetting('regularWorkingTime') : getGlobalSetting('regularWorkingTime'))
    }
  })
})

Template.settings.helpers({
  unit: () => (getUserSetting('timeunit') ? getUserSetting('timeunit') : getGlobalSetting('unit')),
  dailyStartTime: () => (Meteor.user() ? getUserSetting('dailyStartTime') : getGlobalSetting('dailyStartTime')),
  breakStartTime: () => (Meteor.user() ? getUserSetting('breakStartTime') : getGlobalSetting('breakStartTime')),
  breakDuration: () => (Meteor.user() ? getUserSetting('breakDuration') : getGlobalSetting('breakDuration')),
  regularWorkingTime: () => (Meteor.user() ? getUserSetting('regularWorkingTime') : getGlobalSetting('regularWorkingTime')),
  precision: () => (getUserSetting('precision') ? getUserSetting('precision') : getGlobalSetting('precision')),
  timetrackview: () => (getUserSetting('timetrackview') ? getUserSetting('timetrackview') : getGlobalSetting('timetrackview')),
  hoursToDays: () => (getUserSetting('hoursToDays') ? getUserSetting('hoursToDays') : getGlobalSetting('hoursToDays')),
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan: () => (getUserSetting('enableWekan') ? getUserSetting('enableWekan') : getGlobalSetting('enableWekan')),
  siwappurl: () => (getUserSetting('siwappurl') ? getUserSetting('siwappurl') : false),
  siwapptoken: () => (getUserSetting('siwapptoken') ? getUserSetting('siwapptoken') : false),
  titraAPItoken: () => (getUserSetting('APItoken') ? getUserSetting('APItoken') : false),
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
