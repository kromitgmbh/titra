import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import moment from 'moment'
import './timetracker.html'

Template.timetracker.onCreated(function createTimeTracker() {
  this.timer = new ReactiveVar(null)
})
function pad(num, size) {
  const s = `0000${num}`
  return s.substr(s.length - size)
}

Template.timetracker.events({
  'click .js-stop': (event, templateInstance) => {
    event.preventDefault()
    let precision = 2
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
    }
    $('#hours').val(moment.duration(moment().valueOf() - templateInstance.timer.get().valueOf()).asHours().toFixed(precision))
    Meteor.clearTimeout(templateInstance.intervalHandle)
    Template.instance().timer.set(null)
  },
  'click .js-start': (event, templateInstance) => {
    event.preventDefault()
    Template.instance().timer.set(moment())
    const timer = templateInstance.timer.get()
    Template.instance().intervalHandle = Meteor.setInterval(function handleTimer() {
      // console.log(timer)
      const duration = moment.duration(moment().valueOf() - timer.get().valueOf())
      this.$('.js-timer').text(`${pad(duration.hours(), 2)}:${pad(duration.minutes(), 2)}:${pad(duration.seconds(), 2)}`)
    }, 1000)
  },
})

Template.timetracker.helpers({
  timerIsRunning() {
    return Template.instance().timer.get()
  },
})
