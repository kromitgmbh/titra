import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import './settings.html'
import '../components/backbutton.js'
import { getUserSetting } from '../../utils/frontend_helpers'

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
      templateInstance.$('#timeunit').val(getUserSetting('timeunit'))
      templateInstance.$('#timetrackview').val(getUserSetting('timetrackview'))
      templateInstance.$('#dailyStartTime').val(getUserSetting('dailyStartTime'))
      templateInstance.$('#breakStartTime').val(getUserSetting('breakStartTime'))
      templateInstance.$('#breakDuration').val(getUserSetting('breakDuration'))
      templateInstance.$('#regularWorkingTime').val(getUserSetting('regularWorkingTime'))
    }
  })
})

Template.settings.helpers({
  unit: () => getUserSetting('unit'),
  dailyStartTime: () => getUserSetting('dailyStartTime'),
  breakStartTime: () => getUserSetting('breakStartTime'),
  breakDuration: () => getUserSetting('breakDuration'),
  regularWorkingTime: () => getUserSetting('regularWorkingTime'),
  precision: () => getUserSetting('precision'),
  timetrackview: () => getUserSetting('timetrackview'),
  hoursToDays: () => getUserSetting('hoursToDays'),
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan: () => getUserSetting('enableWekan'),
  siwappurl: () => getUserSetting('siwappurl'),
  siwapptoken: () => getUserSetting('siwapptoken'),
  titraAPItoken: () => getUserSetting('APItoken'),
  zammadurl: () => getUserSetting('zammadurl'),
  zammadtoken: () => getUserSetting('zammadtoken'),
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
      zammadtoken: templateInstance.$('#zammadtoken').val(),
      zammadurl: templateInstance.$('#zammadurl').val(),
    },
    (error) => {
      if (error) {
        $.Toast.fire({ text: i18next.t(error.error), icon: 'error' })
      } else {
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
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
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
})
