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
      },
    })
  },
})
