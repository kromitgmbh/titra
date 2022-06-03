async function getHolidayCountries() {
  return new Promise((resolve, reject) => {
    Meteor.call('getHolidayCountries', undefined, (error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

async function getHolidayStates(country) {
  const c = country || ''
  return new Promise((resolve, reject) => {
    Meteor.call('getHolidayStates', { country: c }, (error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

async function getHolidayRegions(country, state) {
  const c = country || ''
  const s = state || ''
  return new Promise((resolve, reject) => {
    Meteor.call('getHolidayRegions', { country: c, state: s }, (error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

async function getHolidays() {
  return new Promise((resolve, reject) => {
    Meteor.call('getHolidays', undefined, (error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

function checkHoliday(holidays, date) {
  const currentHolidays = []
  holidays.forEach((holiday) => {
    if (date >= holiday.start && date < holiday.end) {
      currentHolidays.push(holiday)
    }
  })
  return currentHolidays.length ? currentHolidays : false
}

export {
  getHolidayCountries, getHolidayStates, getHolidayRegions, getHolidays, checkHoliday,
}
