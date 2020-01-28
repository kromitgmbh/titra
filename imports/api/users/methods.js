import { check, Match } from 'meteor/check'
import { checkAuthentication } from '../../utils/server_method_helpers.js'

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
})
