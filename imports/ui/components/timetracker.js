import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import dayjs from 'dayjs'
import preciseDiff from 'dayjs-precise-range'
import './timetracker.html'
import { getUserSetting } from '../../utils/frontend_helpers'

Template.timetracker.onCreated(function createTimeTracker() {
  this.timer = new ReactiveVar(null)
  dayjs.extend(preciseDiff)
})
function pad(num, size) {
  const s = `0000${num}`
  return s.substr(s.length - size)
}

Template.timetracker.events({
  'click .js-stop': (event, templateInstance) => {
    event.preventDefault()
    const duration = dayjs.preciseDiff(dayjs(), templateInstance.timer.get(), true)
    const hours = (Number(duration.days * getUserSetting('hoursToDays'))) + Number(duration.hours) + Number((duration.minutes / 60))
    $('#hours').val(Number(hours).toFixed(getUserSetting('precision')))
    Meteor.clearTimeout(templateInstance.intervalHandle)
    Template.instance().timer.set(null)
  },
  'click .js-start': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.timer.set(dayjs())
    templateInstance.intervalHandle = Meteor.setInterval(function handleTimer() {
      const duration = dayjs.preciseDiff(dayjs(), templateInstance.timer.get(), true)
      this.$('.js-timer').text(`${pad(duration.hours, 2)}:${pad(duration.minutes, 2)}:${pad(duration.seconds, 2)}`)
    }, 1000)
  },
})

Template.timetracker.helpers({
  timerIsRunning() {
    return Template.instance().timer.get()
  },
})
