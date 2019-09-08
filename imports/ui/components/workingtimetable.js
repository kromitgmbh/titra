import moment from 'moment'
import './workingtimetable.html'

Template.workingtimetable.onCreated(function workingtimetableCreated() {
  this.workingTimeEntries = new ReactiveVar([])
  Tracker.autorun(() => {
    if (this.data.project.get()
      && this.data.resource.get()
      && this.data.period.get()
      && this.data.limit.get()) {
      Meteor.call('getWorkingHoursForPeriod',
        {
          projectId: this.data.project.get(),
          userId: this.data.resource.get(),
          period: this.data.period.get(),
          limit: this.data.limit.get(),
        }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            this.workingTimeEntries.set(result.workingHours.sort((a, b) => a.date - b.date))
          }
        })
    }
  })
})
Template.workingtimetable.helpers({
  workingTimeEntries() {
    return Template.instance().workingTimeEntries.get()
  },
  workingTimeSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.totalTime), 0)
  },
  regularWorkingTimeSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.regularWorkingTime), 0)
  },
  regularWorkingTimeDifferenceSum() {
    return Template.instance().workingTimeEntries.get()
      .reduce(((total, element) => total + element.regularWorkingTimeDifference), 0)
  },
  moment(date) {
    return moment(date).format('ddd DD.MM.YYYY')
  },
})
