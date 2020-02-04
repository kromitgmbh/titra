import namedavatar from 'namedavatar'

const clientTimecards = new Mongo.Collection('clientTimecards')

function addToolTipToTableCell(value) {
  if (value) {
    return `<span data-toggle="tooltip" data-placement="left" title="${value}">${value}</span>`
  }
  return ''
}

function getWeekDays(date) {
  const calendar = date.clone().startOf('week')
  return new Array(7).fill(0).map(() => (calendar.add(1, 'day').format('ddd, DD.MM')))
}
function timeInUserUnit(time) {
  if (!time || time === 0) {
    return false
  }
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
    const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    if (Meteor.user().profile.timeunit === 'd') {
      const convertedTime = Number(time / (Meteor.user().profile.hoursToDays
        ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
      return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
    }
    if (time) {
      return Number(time).toFixed(precision)
    }
  }
  return false
}
function displayUserAvatar(meteorUser) {
  if (meteorUser && meteorUser.profile.avatar) {
    return `<img src="${meteorUser.profile.avatar}" alt="${meteorUser.profile.name}" style="height:25px" class="rounded"/>`
  }
  namedavatar.config({
    nameType: 'initials',
    backgroundColors:
      [(meteorUser && meteorUser.profile.avatarColor
        ? meteorUser.profile.avatarColor : '#455A64')],
    minFontSize: 2,
  })
  const rawSVG = namedavatar.getSVG(meteorUser ? meteorUser.profile.name : false)
  rawSVG.classList = 'rounded'
  rawSVG.style.width = '25px'
  rawSVG.style.height = '25px'
  return rawSVG.outerHTML
}
export {
  addToolTipToTableCell,
  getWeekDays,
  clientTimecards,
  timeInUserUnit,
  displayUserAvatar,
}
