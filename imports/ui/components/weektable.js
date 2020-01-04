import moment from 'moment'
import i18next from 'i18next'
import { Mongo } from 'meteor/mongo'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
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
  'click .js-previous-week': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: moment(templateInstance.startDate.get()).subtract(1, 'week').format('YYYY-MM-DD') })
  },
  'click .js-next-week': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: moment(templateInstance.startDate.get()).add(1, 'week').format('YYYY-MM-DD') })
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const weekArray = []
    $('.js-hours').each((index, element) => {
      const startDate = templateInstance.startDate.get().clone().startOf('week')
      const value = $(element).val()
      if (value) {
        const task = $(element).data('task') ? $(element).data('task') : $(element.parentElement.parentElement).find('.js-tasksearch-input').val()
        let hours = Number(value)
        if (Meteor.user().profile.timeunit === 'd') {
          hours *= (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8)
        }
        weekArray.push({
          projectId: $(element).data('project-id'),
          task,
          date: moment.utc(startDate.add(Number($(element).data('week-day')) + 1, 'day').format('YYYY-MM-DD')).toDate(),
          hours,
        })
      }
    })
    Meteor.call('upsertWeek', weekArray, (error) => {
      if (error) {
        console.error(error)
      } else {
        $('.js-tasksearch-input').val('')
        $('.js-tasksearch-input').parent().parent().find('.js-hours').val('')
        $.notify(i18next.t('notifications.time_entry_updated'))
      }
    })
  },
})

Template.weektablerow.onCreated(function weektablerowCreated() {
  this.tempTimeEntries = new ReactiveVar([])
  this.autorun(() => {
    this.subscribe('userTimeCardsForPeriodByProjectByTask',
      {
        projectId: Template.instance().data.projectId,
        startDate: Template.instance().data.startDate.get().toDate(),
        endDate: Template.instance().data.endDate.get().toDate(),
      })
  })
})
Template.weektablerow.events({
  'click .js-newline': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tempTimeEntries.set(templateInstance.tempTimeEntries.get().push({ _id: '' }))
  },
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
    ).fetch().concat(Template.instance().tempTimeEntries.get())
  },
  getHoursForDay(day, task) {
    if (task.entries) {
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
    }
    return ''
  },
  getTotalForTask(task) {
    if (task.entries) {
      if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
        const total = task.entries
          .reduce((tempTotal, amount) => tempTotal + Number(amount.hours), 0)
        const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
        if (Meteor.user().profile.timeunit === 'd') {
          const convertedTotal = Number(total / (Meteor.user().profile.hoursToDays
            ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
          return convertedTotal !== Number(0).toFixed(precision) ? convertedTotal : undefined
        }
        return Number(total).toFixed(precision)
      }
    }
    return ''
  },
  getTotalForDayPerProject(projectId, day) {
    let total = 0
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      clientTimecards.find(
        {
          entries:
          {
            $elemMatch:
            {
              projectId,
            },
          },
        },
      ).fetch().concat(Template.instance().tempTimeEntries.get()).forEach((element) => {
        if (element.entries) {
          total += element.entries.filter((entry) => moment(entry.date).format('ddd, DD.MM') === day)
            .reduce((tempTotal, current) => tempTotal + Number(current.hours), 0)
        }
      })
      const precision = Meteor.user().profile.precision ? Meteor.user().profile.precision : 2
      if (Meteor.user().profile.timeunit === 'd') {
        const convertedTotal = Number(total / (Meteor.user().profile.hoursToDays
          ? Meteor.user().profile.hoursToDays : 8)).toFixed(precision)
        return convertedTotal !== Number(0).toFixed(precision) ? convertedTotal : undefined
      }
      return Number(total).toFixed(precision)
    }
    return false
  },
})
