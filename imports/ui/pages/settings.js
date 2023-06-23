import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { t } from '../../utils/i18n.js'
import './settings.html'
import '../shared components/backbutton.js'
import { getUserSetting, showToast } from '../../utils/frontend_helpers'
import { getHolidayCountries, getHolidayStates, getHolidayRegions } from '../../utils/holiday'

function updateHolidayStates(templateInstance) {
  const holidayState = templateInstance.$('#holidayState')
  holidayState.empty()
  getHolidayStates(templateInstance.$('#holidayCountry').val()).then((states) => {
    if (states) {
      holidayState.prop('disabled', false)
      holidayState[0].options.add(new Option())
      Object.keys(states).forEach((key) => {
        holidayState[0].options.add(new Option(states[key], key))
      })
    } else {
      holidayState.prop('disabled', true)
    }
  })
}

function updateHolidayRegion(templateInstance) {
  const holidayRegion = templateInstance.$('#holidayRegion')
  holidayRegion.empty()
  getHolidayRegions(
    templateInstance.$('#holidayCountry').val(),
    templateInstance.$('#holidayState').val(),
  ).then((regions) => {
    if (regions) {
      holidayRegion.prop('disabled', false)
      holidayRegion[0].options.add(new Option())
      Object.keys(regions).forEach((key) => {
        holidayRegion[0].options.add(new Option(regions[key], key))
      })
    } else {
      holidayRegion.prop('disabled', true)
    }
  })
}

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
      templateInstance.$('#theme').val(getUserSetting('theme') ? getUserSetting('theme') : 'auto')
      templateInstance.$('#language').val(getUserSetting('language') ? getUserSetting('language') : 'auto')
      const country = getUserSetting('holidayCountry')
      const holidayCountry = templateInstance.$('#holidayCountry')
      getHolidayCountries().then((countries) => {
        holidayCountry[0].options.add(new Option())
        Object.keys(countries).forEach((key) => {
          holidayCountry[0].options.add(new Option(countries[key], key))
        })
        holidayCountry.val(country)
      })
      updateHolidayStates(templateInstance)
      templateInstance.$('#holidayState').val(getUserSetting('holidayState'))
      updateHolidayRegion(templateInstance)
      templateInstance.$('#holidayRegion').val(getUserSetting('holidayRegion'))
    }
  })
})

Template.settings.helpers({
  unit: () => getUserSetting('unit'),
  rounding: () => getUserSetting('rounding'),
  startOfWeek: () => getUserSetting('startOfWeek'),
  dailyStartTime: () => getUserSetting('dailyStartTime'),
  breakStartTime: () => getUserSetting('breakStartTime'),
  breakDuration: () => getUserSetting('breakDuration'),
  regularWorkingTime: () => getUserSetting('regularWorkingTime'),
  precision: () => getUserSetting('precision'),
  timetrackview: () => getUserSetting('timetrackview'),
  hoursToDays: () => (getUserSetting('hoursToDays') ? getUserSetting('hoursToDays') : 8),
  displayHoursToDays: () => Template.instance().displayHoursToDays.get(),
  enableWekan: () => getUserSetting('enableWekan'),
  siwappurl: () => getUserSetting('siwappurl'),
  siwapptoken: () => getUserSetting('siwapptoken'),
  titraAPItoken: () => getUserSetting('APItoken'),
  zammadurl: () => getUserSetting('zammadurl'),
  zammadtoken: () => getUserSetting('zammadtoken'),
  gitlaburl: () => getUserSetting('gitlaburl'),
  gitlabtoken: () => getUserSetting('gitlabtoken'),
  theme: () => getUserSetting('theme'),
})

Template.settings.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call(
      'updateSettings',
      {
        unit: templateInstance.$('#unit').val(),
        precision: Number(templateInstance.$('#precision').val()),
        startOfWeek: Number(templateInstance.$('#startOfWeek').val()),
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
        holidayCountry: templateInstance.$('#holidayCountry').val(),
        holidayState: templateInstance.$('#holidayState').val(),
        holidayRegion: templateInstance.$('#holidayRegion').val(),
        zammadtoken: templateInstance.$('#zammadtoken').val(),
        zammadurl: templateInstance.$('#zammadurl').val(),
        gitlabtoken: templateInstance.$('#gitlabtoken').val(),
        gitlaburl: templateInstance.$('#gitlaburl').val(),
        rounding: Number(templateInstance.$('#rounding').val()),
        theme: templateInstance.$('#theme').val(),
        language: templateInstance.$('#language').val()
      },
      (error) => {
        if (error) {
          showToast(t(error.error))
        } else {
          showToast(t('notifications.settings_saved_success'))
          templateInstance.$('#imagePreview').hide()
        }
      },
    )
  },
  'click #generateToken': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#titraAPItoken').val(Random.id())
  },
  'change #timeunit': (event, templateInstance) => {
    event.preventDefault()
    Template.instance().displayHoursToDays.set(
      templateInstance.$('#timeunit').val() === 'd',
    )
  },
  'change #holidayCountry': (event, templateInstance) => {
    event.preventDefault()
    updateHolidayStates(templateInstance)
    updateHolidayRegion(templateInstance)
  },
  'change #holidayState': (event, templateInstance) => {
    event.preventDefault()
    updateHolidayRegion(templateInstance)
  },
  'click .js-reset': (event) => {
    event.preventDefault()
    Meteor.call('resetUserSettings', (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('notifications.settings_saved_success'))
      }
    })
  },
})
