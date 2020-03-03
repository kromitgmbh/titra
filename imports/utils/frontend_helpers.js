import namedavatar from 'namedavatar'
import { Globalsettings } from '../api/globalsettings/globalsettings.js'

const clientTimecards = new Mongo.Collection('clientTimecards')


function getGlobalSetting(name) {
  return Globalsettings.findOne({ name }) ? Globalsettings.findOne({ name }).value : ''
}

function getUserSetting(field) {
  check(field, String)
  if ((Meteor.isClient && !Meteor.loggingIn()) && Meteor.user() && Meteor.user().profile) {
    return Meteor.user().profile[field]
  }
  return false
}

function addToolTipToTableCell(value) {
  if (value) {
    return `<span data-toggle="tooltip" data-placement="left" title="${value}">${value}</span>`
  }
  return ''
}

function getWeekDays(date) {
  const calendar = date.clone().startOf('week')
  return new Array(7).fill(0).map((value, index) => (calendar.add(index + getGlobalSetting('startOfWeek'), 'day').format(getGlobalSetting('weekviewDateFormat'))))
}

function numberWithUserPrecision(number) {
  return getUserSetting('precision') ? number.toFixed(getUserSetting('precision')) : number.toFixed(getGlobalSetting('precision'))
}

function timeInUserUnit(time) {
  if (!time || time === 0) {
    return false
  }
  const precision = getUserSetting('precision') ? getUserSetting('precision') : getGlobalSetting('precision')
  if (getUserSetting('timeunit') === 'd') {
    const convertedTime = Number(time / (getUserSetting('hoursToDays')
      ? getUserSetting('hoursToDays') : getGlobalSetting('hoursToDays'))).toFixed(precision)
    return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
  }
  if (time) {
    return Number(time).toFixed(precision)
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
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

function emojify(match) {
  const emojiImport = Promise.await(import('node-emoji'))
  return emojiImport.default.emojify(match)
}

export {
  addToolTipToTableCell,
  getWeekDays,
  clientTimecards,
  timeInUserUnit,
  displayUserAvatar,
  validateEmail,
  emojify,
  getGlobalSetting,
  numberWithUserPrecision,
  getUserSetting,
}
