import { check, Match } from 'meteor/check'
import { Accounts } from 'meteor/accounts-base'
import { checkAuthentication, checkAdminAuthentication } from '../../utils/server_method_helpers.js'

Meteor.methods({
  async updateSettings({
    unit,
    startOfWeek,
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
    holidayCountry,
    holidayState,
    holidayRegion,
    zammadtoken,
    zammadurl,
    gitlabtoken,
    gitlaburl,
  }) {
    check(unit, String)
    check(startOfWeek, Number)
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
    check(holidayCountry, Match.Maybe(String))
    check(holidayState, Match.Maybe(String))
    check(holidayRegion, Match.Maybe(String))
    check(zammadtoken, String)
    check(zammadurl, String)
    check(gitlabtoken, String)
    check(gitlaburl, String)
    await checkAuthentication(this)
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.unit': unit,
        'profile.startOfWeek': startOfWeek,
        'profile.timeunit': timeunit,
        'profile.timetrackview': timetrackview,
        'profile.enableWekan': enableWekan,
        'profile.hoursToDays': hoursToDays,
        'profile.precision': precision,
        'profile.siwapptoken': siwapptoken,
        'profile.siwappurl': siwappurl,
        'profile.APItoken': APItoken,
        'profile.holidayCountry': holidayCountry,
        'profile.holidayState': holidayState,
        'profile.holidayRegion': holidayRegion,
        'profile.dailyStartTime': dailyStartTime,
        'profile.breakStartTime': breakStartTime,
        'profile.breakDuration': breakDuration,
        'profile.regularWorkingTime': regularWorkingTime,
        'profile.zammadtoken': zammadtoken,
        'profile.zammadurl': zammadurl,
        'profile.gitlabtoken': gitlabtoken,
        'profile.gitlaburl': gitlaburl,
      },
    })
  },
  async resetUserSettings() {
    await checkAuthentication(this)
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $unset: {
        'profile.unit': '',
        'profile.startOfWeek': '',
        'profile.timeunit': '',
        'profile.timetrackview': '',
        'profile.enableWekan': '',
        'profile.hoursToDays': '',
        'profile.precision': '',
        'profile.dailyStartTime': '',
        'profile.breakStartTime': '',
        'profile.breakDuration': '',
        'profile.regularWorkingTime': '',
        'profile.holidayCountry': '',
        'profile.holidayState': '',
        'profile.holidayRegion': '',
        'profile.zammadtoken': '',
        'profile.zammadurl': '',
        'profile.gitlabtoken': '',
        'profile.gitlaburl': '',
      },
    })
  },
  async updateProfile({
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
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.avatar': '' } })
    }
    await checkAuthentication(this)
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.name': name,
        'profile.theme': theme,
        'profile.language': language,
        'profile.avatar': avatar,
        'profile.avatarColor': avatarColor,
      },
    })
  },
  async claimAdmin() {
    await checkAuthentication(this)
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    if (await Meteor.users.find({ isAdmin: true }).countAsync() === 0) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { isAdmin: true } })
      return `Congratulations ${meteorUser.profile.name}, you are now admin.`
    }
    throw new Meteor.Error('Unable to claim admin rights, only the first user on a server is allowed to do this.')
  },
  async adminCreateUser({
    name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc,
  }) {
    await checkAdminAuthentication(this)
    check(name, String)
    check(email, String)
    check(password, String)
    check(isAdmin, Boolean)
    check(currentLanguageProject, String)
    check(currentLanguageProjectDesc, String)
    const profile = { currentLanguageProject, currentLanguageProjectDesc, name }
    const userId = await Accounts.createUserAsync({
      email, password, profile,
    })
    await Meteor.users.updateAsync({ _id: userId }, { $set: { isAdmin } })
    return userId
  },
  async adminDeleteUser({ userId }) {
    await checkAdminAuthentication(this)
    check(userId, String)
    await Meteor.users.removeAsync({ _id: userId })
  },
  async adminToggleUserAdmin({ userId, isAdmin }) {
    await checkAdminAuthentication(this)
    check(userId, String)
    check(isAdmin, Boolean)
    await Meteor.users.updateAsync({ _id: userId }, { $set: { isAdmin } })
  },
  async adminToggleUserState({ userId, inactive }) {
    await checkAdminAuthentication(this)
    check(userId, String)
    check(inactive, Boolean)
    await Meteor.users.updateAsync({ _id: userId }, { $set: { inactive } })
  },
  async setCustomPeriodDates({ customStartDate, customEndDate }) {
    await checkAuthentication(this)
    check(customStartDate, Date)
    check(customEndDate, Date)
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.customStartDate': customStartDate,
        'profile.customEndDate': customEndDate,
      },
    })
  },
  async setTimer({
    timestamp, project, task, startTime, customFields,
  }) {
    await checkAuthentication(this)
    check(timestamp, Match.Maybe(Date))
    check(project, Match.Maybe(String))
    check(task, Match.Maybe(String))
    check(startTime, Match.Maybe(String))
    check(customFields, Match.Maybe(Array))
    if (!timestamp) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.timer': '' } })
    } else {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { 'profile.timer': timestamp } })
    }
    if (!project) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.timer_project': '' } })
    } else {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { 'profile.timer_project': project } })
    }
    if (!task) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.timer_task': '' } })
    } else {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { 'profile.timer_task': task } })
    }
    if (!customFields) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.timer_custom_fields': '' } })
    } else {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { 'profile.timer_custom_fields': customFields } })
    }
    if (!startTime) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.timer_start_time': '' } })
    } else {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { 'profile.timer_start_time': startTime } })
    }
  },
})
