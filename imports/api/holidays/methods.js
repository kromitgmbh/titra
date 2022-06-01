import { check } from 'meteor/check'
import Holidays from 'date-holidays'
import { checkAuthentication } from '../../utils/server_method_helpers.js'
import { Globalsettings } from '../globalsettings/globalsettings.js'

const hd = new Holidays()

function getGlobalSetting(name) {
  return Globalsettings.findOne({ name }) ? Globalsettings.findOne({ name }).value : false
}

function getUserSetting(field) {
  if (Meteor.user() && Meteor.user().profile) {
    return typeof Meteor.user().profile[field] !== 'undefined' ? Meteor.user().profile[field] : getGlobalSetting(field)
  }
  return false
}

function getCurrentHoliday() {
  const country = getUserSetting('holidayCountry')
  const state = getUserSetting('holidayState')
  const region = getUserSetting('holidayRegion')

  return new Holidays(country, state, region)
}

Meteor.methods({
  getHolidays() {
    checkAuthentication(this)
    const h = getCurrentHoliday()
    if (h) {
      return h.getHolidays()
    }
    return []
  },
  getHolidayCountries() {
    return hd.getCountries()
  },
  getHolidayStates({ country }) {
    check(country, String)
    if (country) {
      return hd.getStates(country)
    }
    return false
  },
  getHolidayRegions({ country, state }) {
    check(country, String)
    check(state, String)
    if (country && state) {
      return hd.getRegions(country, state)
    }
    return false
  },
})
