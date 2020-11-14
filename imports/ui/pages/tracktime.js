import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import i18next from 'i18next'
import TinyDatePicker from 'tiny-date-picker'
import 'tiny-date-picker/tiny-date-picker.css'

import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import { getGlobalSetting, getUserSetting } from '../../utils/frontend_helpers.js'

import './tracktime.html'
import '../components/projectselect.js'
import '../components/tasksearch.js'
import '../components/timetracker.js'
import '../components/weektable.js'
import '../components/calendar.js'
import '../components/backbutton.js'

Template.tracktime.onRendered(() => {
  if (!Template.instance().tinydatepicker) {
    Template.instance().tinydatepicker = TinyDatePicker(Template.instance().$('.js-date')[0], {
      format(date) {
        return date ? dayjs(date).format(getGlobalSetting('dateformatVerbose')) : dayjs.format(getGlobalSetting('dateformatVerbose'))
      },
      parse(date) {
        return dayjs(date, getGlobalSetting('dateformatVerbose'))
      },
      appendTo: Template.instance().firstNode,
      mode: 'dp-modal',
      dayOffset: getGlobalSetting('startOfWeek'),
    }).on('select', (_, dp) => {
      if (!dp.state.selectedDate) {
        Template.instance().$('.js-date').first().val(dayjs().format(getGlobalSetting('dateformatVerbose')))
      }
    })
  }
})
Template.tracktime.onCreated(function tracktimeCreated() {
  import('math-expression-evaluator').then((mathexp) => {
    this.math = mathexp
  })
  dayjs.extend(utc)
  dayjs.extend(customParseFormat)
  this.date = new ReactiveVar(dayjs().toDate())
  this.projectId = new ReactiveVar()
  this.tcid = new ReactiveVar()
  this.totalTime = new ReactiveVar(0)
  this.edittcid = new ReactiveVar()
  let handle
  this.autorun(() => {
    if (this.data.tcid && this.data.tcid.get()) {
      this.tcid.set(this.data.tcid.get())
    } else if (FlowRouter.getParam('tcid')) {
      this.tcid.set(FlowRouter.getParam('tcid'))
    }
    if (this.data.dateArg && this.data.dateArg.get()) {
      this.date.set(this.data.dateArg.get())
    } else if (!(this.data.dateArg && this.data.dateArg.get())
      && !(this.data.tcid && this.data.tcid.get()) && FlowRouter.getQueryParam('date')) {
      this.date.set(dayjs(FlowRouter.getQueryParam('date'), 'YYYY-MM-DD').toDate())
    }
    if (this.data.projectIdArg && this.data.projectIdArg.get()) {
      this.projectId.set(this.data.projectIdArg.get())
    } else if (!((this.data.projectIdArg && this.data.projectIdArg.get()) || (this.data.tcid && this.data.tcid.get())) && FlowRouter.getParam('projectId')) {
      this.projectId.set(FlowRouter.getParam('projectId'))
    }
    if (this.tcid.get()) {
      this.subscribe('singleTimecard', this.tcid.get())
      if (this.subscriptionsReady()) {
        this.date.set(Timecards.findOne({ _id: this.tcid.get() })
          ? dayjs(Timecards.findOne({ _id: this.tcid.get() }).date).toDate()
          : dayjs().toDate())
        this.projectId.set(Timecards.findOne({ _id: this.tcid.get() }) ? Timecards.findOne({ _id: this.tcid.get() }).projectId : '')
      }
    }
  })
  this.autorun(() => {
    if (!this.tcid.get()) {
      handle = this.subscribe('myTimecardsForDate', { date: dayjs(this.date.get()).format('YYYY-MM-DD') })
      if (handle.ready()) {
        Timecards.find().forEach((timecard) => {
          this.subscribe('publicProjectName', timecard.projectId)
        })
      }
    }
    if (this.subscriptionsReady()) {
      this.totalTime.set(Timecards.find()
        .fetch().reduce((a, b) => (a === 0 ? b.hours : a + b.hours), 0))
      if (FlowRouter.getParam('projectId') && !FlowRouter.getQueryParam('date')) {
        if (FlowRouter.getParam('projectId') !== 'all') {
          if ($('.js-tasksearch-input')) {
            $('.js-tasksearch-input').focus()
          }
        }
      }
    }
  })
})
Template.tracktime.onDestroyed(() => {
  Template.instance().tinydatepicker.destroy()
})
Template.tracktime.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.edittcid.get()) {
      return
    }
    const buttonLabel = $('.js-save').first().text()
    const selectedProjectElement = templateInstance.$('.js-tracktime-projectselect > .js-target-project')
    let hours = templateInstance.$('#hours').val()
    if (!templateInstance.projectId.get()) {
      selectedProjectElement.addClass('is-invalid')
      $.Toast.fire({ text: i18next.t('notifications.select_project'), icon: 'error' })
      return
    }
    if (!templateInstance.$('.js-tasksearch-input').val()) {
      templateInstance.$('.js-tasksearch-input').addClass('is-invalid')
      $.Toast.fire({ text: i18next.t('notifications.enter_task'), icon: 'error' })
      return
    }
    if (!hours) {
      templateInstance.$('#hours').addClass('is-invalid')
      $.Toast.fire({ text: i18next.t('notifications.enter_time'), icon: 'error' })
      return
    }
    try {
      hours = hours.replace(',', '.')
      templateInstance.math.eval(hours)
    } catch (exception) {
      $.Toast.fire({ text: i18next.t('notifications.check_time_input'), icon: 'error' })
      return
    }
    const projectId = templateInstance.projectId.get()
    const task = templateInstance.$('.js-tasksearch-input').val()
    const date = dayjs.utc(templateInstance.$('.js-date').val(), getGlobalSetting('dateformatVerbose')).toDate()
    if (getGlobalSetting('useStartTime')) {
      if ($('#startTime').val()) {
        date.setHours($('#startTime').val().split(':')[0], $('#startTime').val().split(':')[1])
      } else {
        $.Toast.fire({ text: i18next.t('notifications.check_time_input'), icon: 'error' })
        return
      }
    }
    hours = templateInstance.math.eval(hours)

    if (getUserSetting('timeunit') === 'd') {
      hours *= getUserSetting('hoursToDays')
    }
    if (getUserSetting('timeunit') === 'm') {
      hours /= 60
    }
    templateInstance.$('.js-save').text(i18next.t('navigation.saving'))
    templateInstance.$('.js-save').prop('disabled', true)
    if (templateInstance.tcid.get()) {
      Meteor.call('updateTimeCard', {
        _id: templateInstance.tcid.get(), projectId, date, hours, task,
      }, (error) => {
        if (error) {
          console.error(error)
          if (typeof error.error === 'string') {
            $.Toast.fire({ text: i18next.t(error.error.replace('[', '').replace(']', '')), icon: 'error' })
          }
        } else {
          templateInstance.$('.js-tasksearch-results').addClass('d-none')
          $.Toast.fire(i18next.t('notifications.time_entry_updated'))
          window.requestAnimationFrame(() => {
            templateInstance.$('[data-toggle="tooltip"]').tooltip({
              container: templateInstance.firstNode,
              trigger: 'hover focus',
            })
          })
          if (templateInstance.data.tcid) {
            $('#edit-tc-entry-modal').modal('hide')
          }
        }
        templateInstance.$(event.currentTarget).text(buttonLabel)
        templateInstance.$(event.currentTarget).prop('disabled', false)
      })
    } else {
      Meteor.call('insertTimeCard', {
        projectId, date, hours, task,
      }, (error) => {
        if (error) {
          console.error(error)
          if (typeof error.error === 'string' && error.error.indexOf('notifications') >= 0) {
            $.Toast.fire({ text: i18next.t(error.error), icon: 'error' })
          }
        } else {
          templateInstance.$('.js-tasksearch-input').val('')
          templateInstance.$('.js-tasksearch-input').keyup()
          templateInstance.$('#hours').val('')
          templateInstance.$('.js-tasksearch-results').addClass('d-none')
          $.Toast.fire(i18next.t('notifications.time_entry_saved'))
          templateInstance.$('.js-show-timecards').slideDown('fast')
          templateInstance.$('[data-toggle="tooltip"]').tooltip()
          $('#edit-tc-entry-modal').modal('hide')
        }
        templateInstance.$('.js-save').text(buttonLabel)
        templateInstance.$('.js-save').prop('disabled', false)
      })
    }
  },
  'click .js-previous': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs(templateInstance.date.get()).subtract(1, 'days').format('YYYY-MM-DD') })
    templateInstance.$('#hours').val('')
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
  },
  'click .js-next': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs(templateInstance.date.get()).add(1, 'days').format('YYYY-MM-DD') })
    templateInstance.$('#hours').val('')
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
  },
  'change .js-target-project': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.projectId.set(templateInstance.$(event.currentTarget).val())
    templateInstance.$('.js-tasksearch').first().focus()
  },
  'change .js-date': (event, templateInstance) => {
    if ($(event.currentTarget).val()) {
      let date = dayjs(templateInstance.$(event.currentTarget).val(), getGlobalSetting('dateformatVerbose'))
      if (!date.isValid()) {
        date = dayjs()
        event.currentTarget.value = date.format(getGlobalSetting('dateformatVerbose'))
      }
      date = date.format('YYYY-MM-DD')
      // we need this to correctly capture calender change events from the input
      FlowRouter.setQueryParams({ date })
    }
    // templateInstance.date.set($(event.currentTarget).val())
  },
  'click .js-toggle-timecards': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-show-timecards').slideToggle('fast')
    window.requestAnimationFrame(() => {
      templateInstance.$('[data-toggle="tooltip"]').tooltip({
        container: templateInstance.firstNode,
        trigger: 'hover focus',
      })
    })
  },
  'click .js-time-row': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$(event.currentTarget).popover({
      trigger: 'manual',
      container: templateInstance.$('form'),
      html: true,
      content: templateInstance.$(event.currentTarget).children('.js-popover-content').html(),
    })
    templateInstance.$(event.currentTarget).popover('toggle')
  },
  'click .js-delete-time-entry': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-time-row').popover('dispose')
    const timecardId = event.currentTarget.href.split('/').pop()
    Meteor.call('deleteTimeCard', { timecardId }, (error, result) => {
      if (!error) {
        $.Toast.fire(i18next.t('notifications.time_entry_deleted'))
      } else {
        console.error(error)
        if (typeof error.error === 'string') {
          $.Toast.fire({ text: i18next.t(error.error.replace('[', '').replace(']', '')), icon: 'error' })
        }
      }
    })
  },
  'click .js-open-calendar': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('.js-open-calendar').length > 1) {
      return
    }
    templateInstance.tinydatepicker.open()
  },
  'focus #hours': (event, templateInstance) => {
    templateInstance.$('#hours').removeClass('is-invalid')
  },
  'keydown #hours': (event, templateInstance) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      event.stopPropagation()
      templateInstance.$('.js-save').click()
    }
  },
  'click .js-edit-time-entry': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-time-row').popover('hide')
    templateInstance.edittcid.set(event.currentTarget.href.split('/').pop())
    templateInstance.$('#edit-tc-entry-modal').modal({ focus: false })
    $('#edit-tc-entry-modal').on('hidden.bs.modal', () => {
      templateInstance.edittcid.set(undefined)
    })
  },
})
Template.tracktime.helpers({
  date: () => dayjs(Template.instance().date.get()).format(getGlobalSetting('dateformatVerbose')),
  projectId: () => Template.instance().projectId.get(),
  reactiveProjectId: () => Template.instance().projectId,
  projectName: (_id) => (Projects.findOne({ _id }) ? Projects.findOne({ _id }).name : false),
  timecards: () => Timecards.find(),
  isEdit: () => (Template.instance().tcid && Template.instance().tcid.get())
    || (Template.instance().data.dateArg && Template.instance().data.dateArg.get())
    || (Template.instance().data.projectIdArg && Template.instance().data.projectIdArg.get()),
  task: () => (Timecards.findOne({ _id: Template.instance().tcid.get() })
    ? Timecards.findOne({ _id: Template.instance().tcid.get() }).task : false),
  hours: () => (Timecards.findOne({ _id: Template.instance().tcid.get() })
    ? Timecards.findOne({ _id: Template.instance().tcid.get() }).hours : false),
  showTracker: () => (getUserSetting('timeunit') !== 'd'),
  showStartTime: () => (getGlobalSetting('useStartTime')),
  totalTime: () => Template.instance().totalTime.get(),
  previousDay: () => dayjs(Template.instance().date.get()).subtract(1, 'day').format(getGlobalSetting('dateformatVerbose')),
  nextDay: () => dayjs(Template.instance().date.get()).add(1, 'day').format(getGlobalSetting('dateformatVerbose')),
  borderClass: () => (Template.instance().tcid.get()
    || (Template.instance().data.dateArg && Template.instance().data.dateArg.get())
    || (Template.instance().data.projectIdArg && Template.instance().data.projectIdArg.get()) ? '' : 'tab-borders'),
  edittcid: () => Template.instance().edittcid,
})

Template.tracktimemain.onCreated(function tracktimeCreated() {
  this.timetrackview = new ReactiveVar(getGlobalSetting('timetrackview'))
  this.autorun(() => {
    this.timetrackview.set(getUserSetting('timetrackview'))
    if (FlowRouter.getParam('projectId') && this.subscriptionsReady()) {
      this.timetrackview.set('d')
    } else if (FlowRouter.getQueryParam('view')) {
      this.timetrackview.set(FlowRouter.getQueryParam('view'))
    }
  })
})

Template.tracktimemain.helpers({
  showDay: () => (Template.instance().timetrackview.get() === 'd' ? 'active' : ''),
  showWeek: () => (Template.instance().timetrackview.get() === 'w' ? 'active' : ''),
  showMonth: () => (Template.instance().timetrackview.get() === 'M' ? 'active' : ''),
})

Template.tracktimemain.events({
  'click .js-day': (event) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ view: 'd' })
  },
  'click .js-week': (event) => {
    event.preventDefault()
    FlowRouter.setParams({ projectId: '' })
    FlowRouter.setQueryParams({ view: 'w' })
  },
  'click .js-month': (event) => {
    event.preventDefault()
    FlowRouter.setParams({ projectId: '' })
    FlowRouter.setQueryParams({ view: 'M' })
  },
})
