import Holidays from 'date-holidays'
import { getUserSetting } from './frontend_helpers'

const hd = new Holidays()

function getHolidayCountries() {
  return hd.getCountries()
}

function getHolidayStates(country) {
  if (country) {
    return hd.getStates(country)
  }
  return false
}

function getHolidayRegions(country, state) {
  if (country && state) {
    return hd.getRegions(country, state)
  }
  return false
}

function getCurrentHoliday() {
  const country = getUserSetting('holidayCountry')
  const state = getUserSetting('holidayState')
  const region = getUserSetting('holidayRegion')

  return new Holidays(country, state, region)
}

function isHoliday(day) {
  const h = getCurrentHoliday()
  if (h) {
    return h.isHoliday(day)
  }
  return false
}

function getHolidays() {
  const h = getCurrentHoliday()
  if (h) {
    return h.getHolidays()
  }
  return []
}

export {
  getHolidayCountries, getHolidayStates, getHolidayRegions, isHoliday, getHolidays,
}
