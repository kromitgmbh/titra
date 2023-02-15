import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { t } from '../../../../utils/i18n.js'
import './weektable.html'
import './tasksearch'
import Projects from '../../../../api/projects/projects'
import {
  clientTimecards, getWeekDays, timeInUserUnit, getGlobalSetting, getUserSetting, showToast,
} from '../../../../utils/frontend_helpers'
import { checkHoliday, getHolidays } from '../../../../utils/holiday'

function isHoliday(date) {
  const templateInstance = Template.instance()
  const holidays = templateInstance.holidays.get()
  return checkHoliday(holidays, date)
}

Template.weektable.onCreated(function weekTableCreated() {
  dayjs.extend(utc)
  dayjs.extend(customParseFormat)
  this.subscribe('myprojects', {})

  this.holidays = new ReactiveVar([])
  getHolidays().then((holidays) => {
    this.holidays.set(holidays)
  })
  this.startDate = new ReactiveVar(dayjs.utc().startOf('week').add(getUserSetting('startOfWeek'), 'day'))
  this.endDate = new ReactiveVar(dayjs.utc().endOf('week').add(getUserSetting('startOfWeek'), 'day'))
  this.autorun(() => {
    if (FlowRouter.getQueryParam('date')) {
      this.startDate.set(dayjs.utc(FlowRouter.getQueryParam('date')).startOf('week').add(getUserSetting('startOfWeek'), 'day'), 'YYYY-MM-DD')
      this.endDate.set(dayjs.utc(FlowRouter.getQueryParam('date')).endOf('week').add(getUserSetting('startOfWeek'), 'day'), 'YYYY-MM-DD')
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
  getTotalForDay(day) {
    let total = 0
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      clientTimecards.find().fetch().forEach((element) => {
        if (element.entries) {
          total += element.entries.filter((entry) => dayjs.utc(entry.date).format(getGlobalSetting('weekviewDateFormat')) === day)
            .reduce((tempTotal, current) => tempTotal + Number(current.hours), 0)
        }
      })
      return total !== 0 ? timeInUserUnit(total) : false
    }
    return false
  },
  getWeekTotal() {
    let total = 0
    if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
      clientTimecards.find().fetch().forEach((element) => {
        if (element.entries) {
          total += element.entries
            .reduce((tempTotal, current) => tempTotal + Number(current.hours), 0)
        }
      })
      return total !== 0 ? timeInUserUnit(total) : false
    }
    return false
  },
  hasData() {
    return clientTimecards.find().fetch().length > 0
  },
  isHoliday(weekday) {
    const start = Template.instance().startDate.get()
    const holiday = isHoliday(start.add(weekday, 'd'))
    if (holiday && holiday.length) {
      return holiday[0].name
    }
    return false
  },
})

Template.weektable.events({
  'click .js-previous-week': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs.utc(templateInstance.startDate.get()).subtract(1, 'week').format('YYYY-MM-DD') })
  },
  'click .js-next-week': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs.utc(templateInstance.startDate.get()).add(1, 'week').format('YYYY-MM-DD') })
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const weekArray = []
    let inputError = false
    templateInstance.$('.js-hours').each((index, element) => {
      const startDate = templateInstance.startDate.get().clone().startOf('week')
      const value = templateInstance.$(element).val()
      if (value) {
        const newTaskInput = templateInstance.$(element.parentElement.parentElement).find('.js-tasksearch-input').val()
        const task = templateInstance.$(element).data('task') ? templateInstance.$(element).data('task') : newTaskInput
        if (!task || task.length === 0) {
          showToast(t('notifications.enter_task'))
          inputError = true
          return
        }
        let hours = Number(value)
        if (getUserSetting('timeunit') === 'd') {
          hours *= (getUserSetting('hoursToDays'))
        }
        if (getUserSetting('timeunit') === 'm') {
          hours /= 60
        }
        const projectId = $(element).data('project-id')
        const date = dayjs.utc(startDate.add(Number(templateInstance.$(element).data('week-day')) + 1, 'day').format('YYYY-MM-DD')).toDate()
        const existingElement = weekArray
          .findIndex((arrayElement) => arrayElement.projectId === projectId
          && arrayElement.task === task && dayjs(arrayElement.date).isSame(dayjs(date)))
        if (existingElement >= 0) {
          weekArray[existingElement].hours += hours
        } else {
          weekArray.push({
            projectId,
            task,
            date,
            hours,
          })
        }
      }
    })
    if (weekArray.length > 0 && !inputError) {
      Meteor.call('upsertWeek', weekArray, (error) => {
        if (error) {
          console.error(error)
        } else {
          templateInstance.$('.js-tasksearch-input').val('')
          templateInstance.$('.js-tasksearch-input').parent().parent().find('.js-hours')
            .val('')
          showToast(t('notifications.time_entry_updated'))
          $('tr').trigger('save')
        }
      })
    }
  },
})

Template.weektablerow.onCreated(function weektablerowCreated() {
  this.tempTimeEntries = new ReactiveVar([])
  this.reactiveProjectId = new ReactiveVar()
  this.autorun(() => {
    this.subscribe(
      'userTimeCardsForPeriodByProjectByTask',
      {
        projectId: Template.instance().data.projectId,
        startDate: Template.instance().data.startDate.get().toDate(),
        endDate: Template.instance().data.endDate.get().toDate(),
      },
    )
  })
  this.autorun(() => {
    if (this.data.timeEntries) {
      this.tempTimeEntries = this.timeEntries
    }
    this.reactiveProjectId.set(this.data.projectId)
  })
})
Template.weektablerow.events({
  'click .js-newline': (event, templateInstance) => {
    event.preventDefault()
    const timeEntries = templateInstance.tempTimeEntries?.get() instanceof Array
      ? templateInstance.tempTimeEntries?.get() : []
    if (!timeEntries.find((element) => element._id === '')) {
      timeEntries.push({ _id: '' })
      templateInstance.tempTimeEntries.set(timeEntries)
    }
  },
  'click .js-collapse': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$(event.currentTarget)
    templateInstance.$(templateInstance.$(event.currentTarget).data('target')).collapse('toggle')
  },
  'save tr': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tempTimeEntries.set([])
  },
  'focusout .js-tasksearch-input': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.tempTimeEntries.get()[templateInstance.tempTimeEntries.get().length - 1]
      ._id = templateInstance.$(event.currentTarget).val()
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
    ).fetch().map((entry) => ({ _id: entry._id.split('|')[1], entries: entry.entries })).concat(Template.instance().tempTimeEntries.get())
  },
  getHoursForDay(day, task) {
    if (task.entries) {
      const entryForDay = task.entries
        .filter((entry) => dayjs.utc(entry.date).format(getGlobalSetting('weekviewDateFormat')) === day)
        .reduce(((total, element) => total + element.hours), 0)
      return entryForDay !== 0 ? timeInUserUnit(entryForDay) : ''
    }
    return ''
  },
  getTotalForTask(task) {
    if (task.entries) {
      if (!Meteor.loggingIn() && Meteor.user() && Meteor.user().profile) {
        const total = task.entries
          .reduce((tempTotal, amount) => tempTotal + Number(amount.hours), 0)
        return total !== 0 ? timeInUserUnit(total) : ''
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
          total += element.entries.filter((entry) => dayjs.utc(entry.date).format(getGlobalSetting('weekviewDateFormat')) === day)
            .reduce((tempTotal, current) => tempTotal + Number(current.hours), 0)
        }
      })
      return total !== 0 ? timeInUserUnit(total) : false
    }
    return false
  },
  reactiveProjectId() {
    return Template.instance().reactiveProjectId
  },
  isHoliday: (weekday) => weekday,
})
