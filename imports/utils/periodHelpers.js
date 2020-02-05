import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

function periodToDates(period) {
  check(period, String)
  dayjs.extend(utc)
  let startDate
  let endDate
  switch (period) {
    default:
      startDate = dayjs.utc().startOf('month').toDate()
      endDate = dayjs.utc().endOf('month').toDate()
      break
    case 'currentWeek':
      startDate = dayjs.utc().startOf('week').toDate()
      endDate = dayjs.utc().endOf('week').toDate()
      break
    case 'lastMonth':
      startDate = dayjs.utc().subtract(1, 'month').startOf('month').toDate()
      endDate = dayjs.utc().subtract(1, 'month').endOf('month').toDate()
      break
    case 'last3months':
      startDate = dayjs.utc().subtract(3, 'month').startOf('month').toDate()
      endDate = dayjs.utc().subtract(1, 'month').endOf('month').toDate()
      break
    case 'lastWeek':
      startDate = dayjs.utc().subtract(1, 'week').startOf('week').toDate()
      endDate = dayjs.utc().subtract(1, 'week').endOf('week').toDate()
      break
    case 'currentYear':
      startDate = dayjs.utc().startOf('year').toDate()
      endDate = dayjs.utc().endOf('year').toDate()
      break
    case 'lastYear':
      startDate = dayjs.utc().subtract(1, 'year').startOf('year').toDate()
      endDate = dayjs.utc().subtract(1, 'year').endOf('year').toDate()
      break
    case 'all':
      startDate = dayjs.utc().subtract(20, 'years').startOf('month').toDate()
      endDate = dayjs.utc().add(20, 'years').toDate()
      break
  }
  return { startDate, endDate }
}
function timeInUserUnit(time, meteorUser) {
  const precision = meteorUser.profile.precision ? meteorUser.profile.precision : 2
  if (meteorUser.profile.timeunit === 'd') {
    const convertedTime = Number(time / (meteorUser.profile.hoursToDays
      ? meteorUser.profile.hoursToDays : 8)).toFixed(precision)
    return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
  }
  return Number(time).toFixed(precision)
}
export { periodToDates, timeInUserUnit }
