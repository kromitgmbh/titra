import moment from 'moment'
import './periodtimetable.html'

Template.periodtimetable.onCreated(function periodtimetableCreated() {
  this.periodTimecards = new ReactiveVar([])
  Tracker.autorun(() => {
    Meteor.call('getTotalHoursForPeriod',
      {
        projectId: this.data.project.get(),
        userId: this.data.resource.get(),
        period: this.data.period.get(),
      }, (error, result) => {
        if (error) {
          console.error(error)
        } else {
          this.periodTimecards.set(result)
        }
      })
  })
})
Template.periodtimetable.helpers({
  periodTimecards() {
    return Template.instance().periodTimecards.get()
  },
  periodSum() {
    return Template.instance().periodTimecards.get()
      .reduce(((total, element) => total + element.totalHours), 0)
  },
  userTimeUnit() {
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      return Meteor.user().profile.timeunit === 'd' ? 'Days' : 'Hours'
    }
    return false
  },
  moment(date) {
    return moment(date).format('ddd DD.MM.YYYY')
  },
})
