import { check, Match } from 'meteor/check'
import { Accounts } from 'meteor/accounts-base'
import { checkAuthentication, checkAdminAuthentication } from '../../utils/server_method_helpers.js'

Meteor.methods({
  updateSettings({
    unit,
    timeunit,
    timetrackview,
    enableWekan,
    hoursToDays,
    precision,
    siwapptoken,
    siwappurl,
    dailyStartTime,
    breakStartTime,
    breakDuration,
    regularWorkingTime,
    APItoken,
    zammadtoken,
    zammadurl,
  }) {
    check(unit, String)
    check(timeunit, String)
    check(timetrackview, String)
    check(enableWekan, Boolean)
    check(hoursToDays, Number)
    check(precision, Number)
    check(siwapptoken, String)
    check(siwappurl, String)
    check(dailyStartTime, String)
    check(breakStartTime, String)
    check(breakDuration, String)
    check(regularWorkingTime, String)
    check(APItoken, String)
    check(zammadtoken, String)
    check(zammadurl, String)
    checkAuthentication(this)
    Meteor.users.update({ _id: this.userId }, {
      $set: {
        'profile.unit': unit,
        'profile.timeunit': timeunit,
        'profile.timetrackview': timetrackview,
        'profile.enableWekan': enableWekan,
        'profile.hoursToDays': hoursToDays,
        'profile.precision': precision,
        'profile.siwapptoken': siwapptoken,
        'profile.siwappurl': siwappurl,
        'profile.APItoken': APItoken,
        'profile.dailyStartTime': dailyStartTime,
        'profile.breakStartTime': breakStartTime,
        'profile.breakDuration': breakDuration,
        'profile.regularWorkingTime': regularWorkingTime,
        'profile.zammadtoken': zammadtoken,
        'profile.zammadurl': zammadurl,
      },
    })
  },
  resetUserSettings() {
    checkAuthentication(this)
    Meteor.users.update({ _id: this.userId }, {
      $unset: {
        'profile.unit': '',
        'profile.timeunit': '',
        'profile.timetrackview': '',
        'profile.enableWekan': '',
        'profile.hoursToDays': '',
        'profile.precision': '',
        'profile.dailyStartTime': '',
        'profile.breakStartTime': '',
        'profile.breakDuration': '',
        'profile.regularWorkingTime': '',
      },
    })
  },
  updateProfile({
    name,
    theme,
    language,
    avatar,
    avatarColor,
  }) {
    check(name, String)
    check(theme, String)
    check(language, String)
    check(avatar, Match.Maybe(String))
    check(avatarColor, Match.Maybe(String))
    if (!avatar) {
      Meteor.users.update({ _id: this.userId }, { $unset: { 'profile.avatar': '' } })
    }
    checkAuthentication(this)
    Meteor.users.update({ _id: this.userId }, {
      $set: {
        'profile.name': name,
        'profile.theme': theme,
        'profile.language': language,
        'profile.avatar': avatar,
        'profile.avatarColor': avatarColor,
      },
    })
  },
  claimAdmin() {
    checkAuthentication(this)
    if (Meteor.users.find({ isAdmin: true }).count() === 0) {
      Meteor.users.update({ _id: this.userId }, { $set: { isAdmin: true } })
      return `Congratulations ${Meteor.users.findOne({ _id: this.userId }).profile.name}, you are now admin.`
    }
    throw new Meteor.Error('Unable to claim admin rights, only the first user on a server is allowed to do this.')
  },
  adminCreateUser({
    name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc
  }) {
    checkAdminAuthentication(this)
    check(name, String)
    check(email, String)
    check(password, String)
    check(isAdmin, Boolean)
    check(currentLanguageProject, String)
    check(currentLanguageProjectDesc, String)
    const profile = { currentLanguageProject, currentLanguageProjectDesc, name }
    const userId = Accounts.createUser({
      email, password, profile,
    })
    Meteor.users.update({ _id: userId }, { $set: { isAdmin } })
    return userId
  },
  adminDeleteUser({ userId }) {
    checkAdminAuthentication(this)
    check(userId, String)
    Meteor.users.remove({ _id: userId })
  },
  adminToggleUserAdmin({ userId, isAdmin }) {
    checkAdminAuthentication(this)
    check(userId, String)
    check(isAdmin, Boolean)
    Meteor.users.update({ _id: userId }, { $set: { isAdmin } })
  },
  setCustomPeriodDates({ customStartDate, customEndDate }) {
    checkAuthentication(this)
    check(customStartDate, Date)
    check(customEndDate, Date)
    Meteor.users.update({ _id: this.userId }, {
      $set: {
        'profile.customStartDate': customStartDate,
        'profile.customEndDate': customEndDate,
      },
    })
  },
  setTimer({ timestamp }) {
    checkAuthentication(this)
    check(timestamp, Match.Maybe(Date))
    if (!timestamp) {
      Meteor.users.update({ _id: this.userId }, { $unset: { 'profile.timer': '' } })
    } else {
      Meteor.users.update({ _id: this.userId }, { $set: { 'profile.timer': timestamp } })
    }
  },
})
