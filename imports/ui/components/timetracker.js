import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import dayjs from 'dayjs'
import './timetracker.html'
import { getGlobalSetting } from '../../utils/frontend_helpers'

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
    let precision = getGlobalSetting('precision')
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : getGlobalSetting('precision')
    }
    templateInstance.$('#hours').val(dayjs.duration(dayjs().valueOf() - templateInstance.timer.get().valueOf()).asHours().toFixed(precision))
    Meteor.clearTimeout(templateInstance.intervalHandle)
    Template.instance().timer.set(null)
  },
  'click .js-start': (event, templateInstance) => {
    event.preventDefault()
    Template.instance().timer.set(dayjs())
    const timer = templateInstance.timer.get()
    Template.instance().intervalHandle = Meteor.setInterval(function handleTimer() {
      // console.log(timer)
      const duration = dayjs.duration(dayjs().valueOf() - timer.get().valueOf())
      this.$('.js-timer').text(`${pad(duration.hours(), 2)}:${pad(duration.minutes(), 2)}:${pad(duration.seconds(), 2)}`)
    }, 1000)
  },
})

Template.timetracker.helpers({
  timerIsRunning() {
    return Template.instance().timer.get()
  },
})
