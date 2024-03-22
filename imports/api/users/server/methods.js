import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { check, Match } from 'meteor/check'
import { Accounts } from 'meteor/accounts-base'
import { authenticationMixin, adminAuthenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers.js'

/**
 * Updates a user's settings.
 * @param {Object} args - The arguments object containing the user's settings.
 * @param {string} args.unit - The unit of time to use for the calendar.
 * @param {number} args.startOfWeek - The day of the week to start the week on.
 * @param {string} args.timeunit - The unit of time to use for the time tracking.
 * @param {string} args.timetrackview - The view to use for the time tracking.
 * @param {boolean} args.enableWekan - Whether to enable Wekan integration.
 * @param {number} args.hoursToDays - The number of hours in a day.
 * @param {number} args.precision - The precision to use for time tracking.
 * @param {string} args.siwapptoken - The token to use for Siwapp integration.
 * @param {string} args.siwappurl - The URL to use for Siwapp integration.
 * @param {string} args.dailyStartTime - The daily start time to use for time tracking.
 * @param {string} args.breakStartTime - The break start time to use for time tracking.
 * @param {string} args.breakDuration - The break duration to use for time tracking.
 * @param {string} args.regularWorkingTime - The regular working time to use for time tracking.
 * @param {string} args.APItoken - The API token to use for time tracking.
 * @param {string} args.holidayCountry - The country to use for holiday integration.
 * @param {string} args.holidayState - The state to use for holiday integration.
 * @param {string} args.holidayRegion - The region to use for holiday integration.
 * @param {string} args.zammadtoken - The token to use for Zammad integration.
 * @param {string} args.zammadurl - The URL to use for Zammad integration.
 * @param {string} args.gitlabtoken - The token to use for Gitlab integration.
 * @param {string} args.gitlaburl - The URL to use for Gitlab integration.
 * @param {number} args.rounding - The rounding to use for time tracking.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 */
const updateSettings = new ValidatedMethod({
  name: 'updateSettings',
  validate(args) {
    check(args.unit, String)
    check(args.startOfWeek, Number)
    check(args.timeunit, String)
    check(args.timetrackview, String)
    check(args.enableWekan, Boolean)
    check(args.hoursToDays, Number)
    check(args.precision, Number)
    check(args.siwapptoken, Match.Maybe(String))
    check(args.siwappurl, Match.Maybe(String))
    check(args.dailyStartTime, String)
    check(args.breakStartTime, String)
    check(args.breakDuration, String)
    check(args.regularWorkingTime, String)
    check(args.APItoken, Match.Maybe(String))
    check(args.holidayCountry, Match.Maybe(String))
    check(args.holidayState, Match.Maybe(String))
    check(args.holidayRegion, Match.Maybe(String))
    check(args.zammadtoken, Match.Maybe(String))
    check(args.zammadurl, Match.Maybe(String))
    check(args.gitlabtoken, Match.Maybe(String))
    check(args.gitlaburl, Match.Maybe(String))
    check(args.rounding, Match.Maybe(Number))
    check(args.theme, String)
    check(args.language, String)
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    unit,
    startOfWeek,
    timeunit,
    timetrackview,
    enableWekan,
    hoursToDays,
    precision,
    siwapptoken, siwappurl,
    dailyStartTime, breakStartTime, breakDuration, regularWorkingTime,
    APItoken,
    holidayCountry, holidayState, holidayRegion,
    zammadtoken, zammadurl,
    gitlabtoken, gitlaburl,
    rounding,
    theme,
    language,
  }) {
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
        'profile.rounding': rounding,
        'profile.theme': theme,
        'profile.language': language,
      },
    })
  },
})

const updateTimeUnit = new ValidatedMethod({
  name: 'updateTimeUnit',
  validate(args) {
    check(args.timeunit, String)
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    timeunit
  }) {
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.timeunit': timeunit,
      },
    })
  },
})

/**
 * Resets a user's settings.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 */
const resetUserSettings = new ValidatedMethod({
  name: 'resetUserSettings',
  validate: null,
  mixins: [authenticationMixin, transactionLogMixin],
  async run() {
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
        'profile.rounding': '',
      },
    })
  },
})
/**
 * Updates a user's profile.
 * @param {string} args.name - The name to use for the user.
 * @param {string} args.avatar - The avatar to use for the user.
 * @param {string} args.avatarColor - The avatar color to use for the user.
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 */
const updateProfile = new ValidatedMethod({
  name: 'updateProfile',
  validate(args) {
    check(args, {
      name: String,
      avatar: Match.Maybe(String),
      avatarColor: Match.Maybe(String),
    })
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    name, avatar, avatarColor,
  }) {
    if (!avatar) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $unset: { 'profile.avatar': '' } })
    }
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.name': name,
        'profile.avatar': avatar,
        'profile.avatarColor': avatarColor,
      },
    })
  },
})
/**
 * Try to claim admin rights for the current user
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If user is not the first user on the server.
 */
const claimAdmin = new ValidatedMethod({
  name: 'claimAdmin',
  validate: null,
  mixins: [authenticationMixin, transactionLogMixin],
  async run() {
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    if (await Meteor.users.find({ isAdmin: true }).countAsync() === 0) {
      await Meteor.users.updateAsync({ _id: this.userId }, { $set: { isAdmin: true } })
      return `Congratulations ${meteorUser.profile.name}, you are now admin.`
    }
    throw new Meteor.Error('Unable to claim admin rights, only the first user on a server is allowed to do this.')
  },
})
/**
 * Allow admins to create a new user
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If user is not an admin.
 * @param {String} name - The user's name
 * @param {String} email - The user's email
 * @param {String} password - The user's password
 * @param {Boolean} isAdmin - Whether the user is an admin
 * @param {String} currentLanguageProject - The user's current language project
 * @param {String} currentLanguageProjectDesc - The user's current language project description
*/
const adminCreateUser = new ValidatedMethod({
  name: 'adminCreateUser',
  validate(args) {
    check(args, {
      name: String,
      email: String,
      password: String,
      isAdmin: Boolean,
      currentLanguageProject: String,
      currentLanguageProjectDesc: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc,
  }) {
    const profile = { currentLanguageProject, currentLanguageProjectDesc, name }
    const userId = await Accounts.createUserAsync({
      email, password, profile,
    })
    await Meteor.users.updateAsync({ _id: userId }, { $set: { isAdmin } })
    return userId
  },
})
/**
 * Allow admins to delete a user
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If user is not an admin.
 * @param {String} userId - The user's id
 */
const adminDeleteUser = new ValidatedMethod({
  name: 'adminDeleteUser',
  validate(args) {
    check(args, {
      userId: String,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ userId }) {
    await Meteor.users.removeAsync({ _id: userId })
  },
})
/**
 * Allow admins to toggle a user's admin status
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If user is not an admin.
 * @param {String} userId - The user's id
 * @param {Boolean} isAdmin - The user's admin status
 */
const adminToggleUserAdmin = new ValidatedMethod({
  name: 'adminToggleUserAdmin',
  validate(args) {
    check(args, {
      userId: String,
      isAdmin: Boolean,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ userId, isAdmin }) {
    await Meteor.users.updateAsync({ _id: userId }, { $set: { isAdmin } })
  },
})
/**
 * Allow admins to toggle a user's inactive status
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @throws {Meteor.Error} If user is not an admin.
 * @param {String} userId - The user's id
 * @param {Boolean} inactive - The user's inactive status
 */
const adminToggleUserState = new ValidatedMethod({
  name: 'adminToggleUserState',
  validate(args) {
    check(args, {
      userId: String,
      inactive: Boolean,
    })
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ userId, inactive }) {
    await Meteor.users.updateAsync({ _id: userId }, { $set: { inactive } })
  },
})
/**
 * Set custom period dates for the current user
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @param {Date} customStartDate - The custom start date
 * @param {Date} customEndDate - The custom end date
 */
const setCustomPeriodDates = new ValidatedMethod({
  name: 'setCustomPeriodDates',
  validate(args) {
    check(args, {
      customStartDate: Date,
      customEndDate: Date,
    })
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({ customStartDate, customEndDate }) {
    await Meteor.users.updateAsync({ _id: this.userId }, {
      $set: {
        'profile.customStartDate': customStartDate,
        'profile.customEndDate': customEndDate,
      },
    })
  },
})
/**
 * Start a timer for the current user
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {String} 'notifications.success' if successful
 * @param {Date} timestamp - The timestamp of the timer
 * @param {String} project - The project of the timer
 * @param {String} task - The task of the timer
 * @param {String} startTime - The start time of the timer
 * @param {Array} customFields - The custom fields of the timer
 */
const setTimer = new ValidatedMethod({
  name: 'setTimer',
  validate(args) {
    check(args.timestamp, Match.Maybe(Date))
    check(args.project, Match.Maybe(String))
    check(args.task, Match.Maybe(String))
    check(args.startTime, Match.Maybe(String))
    check(args.customFields, Match.Maybe(Array))
  },
  mixins: [authenticationMixin, transactionLogMixin],
  async run({
    timestamp, project, task, startTime, customFields,
  }) {
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
/**
 * Get user statistics for the admininistration > users page
 * @throws {Meteor.Error} If user is not authenticated.
 * @returns {Object} The user statistics
 */
const adminUserStats = new ValidatedMethod({
  name: 'adminUserStats',
  validate: null,
  mixins: [adminAuthenticationMixin],
  async run() {
    return {
      totalUsers: await Meteor.users.find({}).countAsync(),
      newUsers: await Meteor.users
        .find({ createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        .countAsync(),
      adminUsers: await Meteor.users.find({ isAdmin: true }).countAsync(),
      inactiveUsers: await Meteor.users.find({ inactive: true }).countAsync(),
    }
  },
})

export {
  claimAdmin,
  adminCreateUser,
  adminDeleteUser,
  adminToggleUserAdmin,
  adminToggleUserState,
  setCustomPeriodDates,
  setTimer,
  updateProfile,
  updateSettings,
  resetUserSettings,
  adminUserStats,
}
