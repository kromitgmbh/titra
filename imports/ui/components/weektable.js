import moment from 'moment'
import { Mongo } from 'meteor/mongo'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './weektable.html'
import './tasksearch'
import Projects from '../../api/projects/projects'

function getWeekDays(date) {
  const calendar = date.clone().startOf('week')
  return new Array(7).fill(0).map(() => (calendar.add(1, 'day').format('ddd, DD.MM')))
}
const clientTimecards = new Mongo.Collection('clientTimecards')
Template.weektable.onCreated(function weekTableCreated() {
  this.subscribe('myprojects')
  this.startDate = new ReactiveVar(moment(moment().startOf('week')))
  this.endDate = new ReactiveVar(moment(moment().endOf('week')))

  this.autorun(() => {
    if (FlowRouter.getQueryParam('date')) {
      this.startDate.set(moment(moment(FlowRouter.getQueryParam('date')).startOf('week')), 'YYYY-MM-DD')
      this.endDate.set(moment(moment(FlowRouter.getQueryParam('date')).endOf('week')), 'YYYY-MM-DD')
    }
  })
})

Template.weektable.helpers({
  weekDays() {
    return getWeekDays(Template.instance().startDate.get())
  },
  projects() {
    return Projects.find({ $or: [{ archived: { $exists: false } }, { archived: false }] })
  },
  startDate() { return Template.instance().startDate },
  endDate() { return Template.instance().endDate },
})

Template.weektable.events({
  'click .js-previous': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: moment(templateInstance.startDate.get()).subtract(1, 'week').format('YYYY-MM-DD') })
  },
  'click .js-next': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: moment(templateInstance.startDate.get()).add(1, 'week').format('YYYY-MM-DD') })
  },
})

Template.weektablerow.onCreated(function weektablerowCreated() {
  this.autorun(() => {
    this.subscribe('userTimeCardsForPeriodByProjectByTask',
      {
        projectId: Template.instance().data.projectId,
        startDate: Template.instance().data.startDate.get().toDate(),
        endDate: Template.instance().data.endDate.get().toDate(),
      })
  })
})
Template.weektablerow.helpers({
  weekDays() {
    return getWeekDays(Template.instance().data.startDate.get())
  },
  tasks() {
    return clientTimecards.find(
      {
        entries:
        {
          $elemMatch:
          {
            projectId: Template.instance().data.projectId,
          },
        },
      },
    )
  },
  getHoursForDay(day, task) {
    const entryForDay = task.entries
      .find((entry) => moment(entry.date).format('ddd, DD.MM') === day)
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile && entryForDay) {
      const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
      if (Meteor.user().profile.timeunit === 'd') {
        const convertedTime = Number(entryForDay.hours / (Meteor.user().profile.hoursToDays
          ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
        return convertedTime !== Number(0).toFixed(precision) ? convertedTime : undefined
      }
      return Number(entryForDay.hours).toFixed(precision)
    }
    return ''
  },
})
