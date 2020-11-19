import namedavatar from 'namedavatar'
import i18next from 'i18next'
import { Globalsettings } from '../api/globalsettings/globalsettings.js'

const clientTimecards = new Mongo.Collection('clientTimecards')
const i18nextReady = new ReactiveVar(false)
let globalT

function getGlobalSetting(name) {
  return Globalsettings.findOne({ name }) ? Globalsettings.findOne({ name }).value : false
}

function getUserSetting(field) {
  check(field, String)
  if ((Meteor.isClient && !Meteor.loggingIn()) && Meteor.user() && Meteor.user().profile) {
    return Meteor.user().profile[field] ? Meteor.user().profile[field] : getGlobalSetting(field)
  }
  return false
}

function addToolTipToTableCell(value) {
  if (value) {
    return `<span class="js-tooltip" data-toggle="tooltip" data-placement="left" title="${value}">${value}</span>`
  }
  return ''
}

function getWeekDays(date) {
  const calendar = date.clone().startOf('week')
  return new Array(7).fill(0).map((value, index) => (calendar.add(index + getGlobalSetting('startOfWeek'), 'day').format(getGlobalSetting('weekviewDateFormat'))))
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
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

async function emojify(match) {
  const emojiImport = await import('node-emoji')
  return emojiImport.default.emojify(match)
}
function loadLanguage(language, i18nextDebugMode) {
  switch (language) {
    default:
      import('../ui/translations/en.json').then((en) => {
        i18next.init({
          lng: 'en',
          debug: i18nextDebugMode,
          resources: {
            en: {
              translation: en.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      $('html').attr('lang', 'en')
      break
    case 'en':
      import('../ui/translations/en.json').then((en) => {
        i18next.init({
          lng: 'en',
          debug: i18nextDebugMode,
          resources: {
            en: {
              translation: en.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      $('html').attr('lang', 'en')
      break
    case 'de':
      import('../ui/translations/de.json').then((de) => {
        i18next.init({
          lng: 'de',
          debug: i18nextDebugMode,
          resources: {
            de: {
              translation: de.default,
            },
          },
        }).then((t) => {
          globalT = t
          i18nextReady.set(true)
        })
      })
      $('html').attr('lang', 'de')
      break
  }
}
function getUserTimeUnitVerbose() {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nextReady.get()) {
    switch (getUserSetting('timeunit')) {
      case 'm':
        return i18next.t('globals.minute_plural')
      case 'h':
        return i18next.t('globals.hour_plural')
      case 'd':
        return i18next.t('globals.day_plural')
      default:
        return i18next.t('globals.hour_plural')
    }
  }
  return false
}
function getUserTimeUnitAbbreviated() {
  if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && i18nextReady.get()) {
    switch (getUserSetting('timeunit')) {
      case 'm':
        return i18next.t('globals.unit_minute_short')
      case 'h':
        return i18next.t('globals.unit_hour_short')
      case 'd':
        return i18next.t('globals.unit_day_short')
      default:
        return i18next.t('globals.unit_hour_short')
    }
  }
  return false
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
  loadLanguage,
  i18nextReady,
  getUserTimeUnitVerbose,
  getUserTimeUnitAbbreviated,
  globalT,
}
