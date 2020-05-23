import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import dayjs from 'dayjs'
import preciseDiff from 'dayjs-precise-range'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './timetracker.html'
import { getUserSetting } from '../../utils/frontend_helpers'

function pad(num, size) {
  const s = `0000${num}`
  return s.substr(s.length - size)
}

Template.timetracker.onCreated(function createTimeTracker() {
  this.timer = new ReactiveVar(null)
  dayjs.extend(preciseDiff)
  this.autorun(() => {
    const storedTimer = getUserSetting('timer')
    if (storedTimer) {
      this.timer.set(dayjs(storedTimer))
      if (!this.intervalHandle) {
        this.intervalHandle = Meteor.setInterval(() => {
          const duration = dayjs.preciseDiff(dayjs(), storedTimer, true)
          $('.js-timer').text(`${pad(duration.hours, 2)}:${pad(duration.minutes, 2)}:${pad(duration.seconds, 2)}`)
        }, 1000)
      }
    }
  })
})

Template.timetracker.events({
  'click .js-stop': (event, templateInstance) => {
    event.preventDefault()
    if (FlowRouter.getRouteName() !== 'tracktime') {
      FlowRouter.go('tracktime')
      return
    }
    const duration = dayjs.preciseDiff(dayjs(), templateInstance.timer.get(), true)
    const hours = (Number(duration.days * getUserSetting('hoursToDays'))) + Number(duration.hours) + Number((duration.minutes / 60))
    $('#hours').val(Number(hours).toFixed(getUserSetting('precision')))
    Meteor.clearTimeout(templateInstance.intervalHandle)
    templateInstance.intervalHandle = undefined
    Meteor.call('setTimer', { timestamp: undefined }, (error) => {
      if (error) {
        console.error(error)
      }
    })
    Template.instance().timer.set(null)
  },
  'click .js-start': (event) => {
    event.preventDefault()
    Meteor.call('setTimer', { timestamp: new Date() }, (error) => {
      if (error) {
        console.error(error)
      }
    })
    Template.instance().timer.set(new Date())
  },
})

Template.timetracker.helpers({
  timerIsRunning() {
    return Template.instance().timer.get()
  },
  isWidget: () => FlowRouter.getRouteName() !== 'tracktime',
})

Template.timetracker.onDestroyed(function timetrackerDestroyed() {
  Meteor.clearTimeout(this.intervalHandle)
})
