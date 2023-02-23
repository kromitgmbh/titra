import { check } from 'meteor/check'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import Holidays from 'date-holidays'
import { authenticationMixin } from '../../../utils/server_method_helpers.js'
import { Globalsettings } from '../../globalsettings/globalsettings.js'

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

/**
@summary Get a list of all holidays.
@return {Array}
Returns a list of holidays.
*/
const getHolidays = new ValidatedMethod({
  name: 'getHolidays',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    const h = await getCurrentHoliday()
    if (h) {
      return h.getHolidays()
    }
    return []
  },
})
/**
@summary Get a list of all holiday countries.
@return {Array}
Returns a list of holiday countries.
*/
const getHolidayCountries = new ValidatedMethod({
  name: 'getHolidayCountries',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return hd.getCountries()
  },
})
/**
@summary Get a list of all holiday states.
@param {Object} options
@param {string} options.country - ID of the country to get list of holiday states for
@return {Array} Returns a list of holiday countries.
*/
const getHolidayStates = new ValidatedMethod({
  name: 'getHolidayStates',
  validate(args) {
    check(args, {
      country: String,
    })
  },
  mixins: [authenticationMixin],
  async run({ country }) {
    if (country) {
      return hd.getStates(country)
    }
    return false
  },
})
/**
@summary Get a list of all holiday regions.
@param {Object} options
@param {string} options.country - ID of the country to get list of holiday states for
@param {string} options.state - ID of the state to get list of holiday states for
@return {Array} Returns a list of holiday countries.
*/
const getHolidayRegions = new ValidatedMethod({
  name: 'getHolidayRegions',
  validate(args) {
    check(args, {
      country: String,
      state: String,
    })
  },
  mixins: [authenticationMixin],
  async run({ country, state }) {
    if (country && state) {
      return hd.getRegions(country, state)
    }
    return false
  },
})
export {
  getHolidayCountries, getHolidayRegions, getHolidayStates, getHolidays,
}
