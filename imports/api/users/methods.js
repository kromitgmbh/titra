import { check, Match } from 'meteor/check'
import { checkAuthentication } from '../../utils/server_method_helpers.js'

Meteor.methods({
  updateSettings({
    name,
    unit,
    timeunit,
    timetrackview,
    enableWekan,
    hoursToDays,
    precision,
    siwapptoken,
    siwappurl,
    theme,
    language,
    dailyStartTime,
    breakStartTime,
    breakDuration,
    regularWorkingTime,
    APItoken,
    avatar,
    avatarColor,
  }) {
    check(name, String)
    check(unit, String)
    check(timeunit, String)
    check(timetrackview, String)
    check(enableWekan, Boolean)
    check(hoursToDays, Number)
    check(precision, Number)
    check(siwapptoken, String)
    check(siwappurl, String)
    check(theme, String)
    check(language, String)
    check(dailyStartTime, String)
    check(breakStartTime, String)
    check(breakDuration, String)
    check(regularWorkingTime, String)
    check(APItoken, String)
    check(avatar, Match.Maybe(String))
    check(avatarColor, Match.Maybe(String))
    if (!avatar) {
      Meteor.users.update({ _id: this.userId }, { $unset: { 'profile.avatar': '' } })
    }
    checkAuthentication(this)
    Meteor.users.update({ _id: this.userId }, {
      $set: {
        'profile.name': name,
        'profile.unit': unit,
        'profile.timeunit': timeunit,
        'profile.timetrackview': timetrackview,
        'profile.enableWekan': enableWekan,
        'profile.hoursToDays': hoursToDays,
        'profile.precision': precision,
        'profile.siwapptoken': siwapptoken,
        'profile.siwappurl': siwappurl,
        'profile.APItoken': APItoken,
        'profile.theme': theme,
        'profile.language': language,
        'profile.dailyStartTime': dailyStartTime,
        'profile.breakStartTime': breakStartTime,
        'profile.breakDuration': breakDuration,
        'profile.regularWorkingTime': regularWorkingTime,
        'profile.avatar': avatar,
        'profile.avatarColor': avatarColor,
      },
    })
  },
})
