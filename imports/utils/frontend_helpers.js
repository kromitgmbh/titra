import namedavatar from 'namedavatar'
import { i18nReady, t } from './i18n.js'
import { Globalsettings } from '../api/globalsettings/globalsettings.js'

const clientTimecards = new Mongo.Collection('clientTimecards')

function getGlobalSetting(name) {
  return Globalsettings.findOne({ name }) ? Globalsettings.findOne({ name }).value : false
}

function getUserSetting(field) {
  check(field, String)
  if ((Meteor.isClient && !Meteor.loggingIn()) && Meteor.user() && Meteor.user().profile) {
    return typeof Meteor.user().profile[field] !== 'undefined' ? Meteor.user().profile[field] : getGlobalSetting(field)
  }
  return false
}

function addToolTipToTableCell(value) {
  if (value) {
    const sanitizedValue = $('<div/>').text(value).html()
    return `<span class="js-tooltip" data-bs-toggle="tooltip" data-bs-placement="left" title='${sanitizedValue}'>${sanitizedValue}</span>`
  }
  return ''
}

function getWeekDays(date) {
  const calendar = date.clone().startOf('week')
  return new Array(7).fill(0).map((value, index) => (calendar.add(index + getUserSetting('startOfWeek'), 'day').format(getGlobalSetting('weekviewDateFormat'))))
}

function numberWithUserPrecision(number) {
  return getUserSetting('precision') ? Number(number).toFixed(getUserSetting('precision')) : Number(number).toFixed(getGlobalSetting('precision'))
}

function timeInUserUnit(time) {
  if (!time || time === 0) {
    return false
  }
  const precision = getUserSetting('precision')
  if (getUserSetting('timeunit') === 'd') {
    const convertedTime = Number(time / getUserSetting('hoursToDays')).toFixed(precision)
    return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
  }
  if (getUserSetting('timeunit') === 'm') {
    const convertedTime = Number(time * 60).toFixed(precision)
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
  if (Meteor.loginWithLDAP) {
    return true
  }
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

async function emojify(match) {
  const emojiImport = await import('node-emoji')
  return emojiImport.default.emojify(match, (name) => name)
}
function getUserTimeUnitVerbose() {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nReady.get()) {
    switch (getUserSetting('timeunit')) {
      case 'm':
        return t('globals.minute_plural')
      case 'h':
        return t('globals.hour_plural')
      case 'd':
        return t('globals.day_plural')
      default:
        return t('globals.hour_plural')
    }
  }
  return false
}
function getUserTimeUnitAbbreviated() {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nReady.get()) {
    switch (getUserSetting('timeunit')) {
      case 'm':
        return t('globals.unit_minute_short')
      case 'h':
        return t('globals.unit_hour_short')
      case 'd':
        return t('globals.unit_day_short')
      default:
        return t('globals.unit_hour_short')
    }
  }
  return false
}
function showToast(message) {
  import('bootstrap').then((bs) => {
    $('.toast').removeClass('d-none')
    $('.toast-body').text(message)
    new bs.Toast($('.toast').get(0)).show()
  })
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
  getUserTimeUnitVerbose,
  getUserTimeUnitAbbreviated,
  showToast,
}
