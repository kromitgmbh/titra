Meteor.methods({
  updateSettings({ name, unit, timeunit, timetrackview }) {
    check(name, String)
    check(unit, String)
    check(timeunit, String)
    check(timetrackview, String)
    Meteor.users.update({ _id: this.userId }, { $set: { 'profile.name': name, 'profile.unit': unit, 'profile.timeunit': timeunit, 'profile.timetrackview': timetrackview } })
  },
})
