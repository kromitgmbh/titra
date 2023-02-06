import { check } from 'meteor/check'
import Holidays from 'date-holidays'
import { checkAuthentication } from '../../utils/server_method_helpers.js'
import { Globalsettings } from '../globalsettings/globalsettings.js'

const hd = new Holidays()

async function getGlobalSetting(name) {
  const globalsetting = await Globalsettings.findOneAsync({ name })
  return globalsetting ? globalsetting.value : false
}
// TODO: this should import the getUserSetting from frontend_helpers instead!
async function getUserSetting(field) {
  const meteorUser = await Meteor.userAsync()
  if (meteorUser?.profile) {
    return typeof meteorUser.profile[field] !== 'undefined' ? meteorUser.profile[field] : getGlobalSetting(field)
  }
  return false
}

async function getCurrentHoliday() {
  const country = await getUserSetting('holidayCountry')
  const state = await getUserSetting('holidayState')
  const region = await getUserSetting('holidayRegion')
  return new Holidays(country, state, region)
}

Meteor.methods({
  async getHolidays() {
    await checkAuthentication(this)
    const h = await getCurrentHoliday()
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
