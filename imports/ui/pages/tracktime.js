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
    Template.instance().tinydatepicker = TinyDatePicker('#date', {
      format(date) {
        return date ? dayjs(date).format(getGlobalSetting('dateformatVerbose')) : dayjs().format(getGlobalSetting('dateformatVerbose'))
      },
      parse(date) {
        return dayjs(date, getGlobalSetting('dateformatVerbose'))
      },
      mode: 'dp-modal',
      dayOffset: getGlobalSetting('startOfWeek'),
    }).on('select', (_, dp) => {
      if (!dp.state.selectedDate) {
        $('#date').val(dayjs().format(getGlobalSetting('dateformatVerbose')))
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
  this.date = new ReactiveVar(dayjs.utc().toDate())
  this.projectId = new ReactiveVar()
  this.tcid = new ReactiveVar()
  this.totalTime = new ReactiveVar(0)
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
      this.date.set(dayjs.utc(FlowRouter.getQueryParam('date'), 'YYYY-MM-DD').toDate())
    }
    if (this.data.projectIdArg && this.data.projectIdArg.get()) {
      this.projectId.set(this.data.projectIdArg.get())
    } else if (!(this.data.projectIdArg && this.data.projectIdArg.get()) && FlowRouter.getParam('projectId')) {
      this.projectId.set(FlowRouter.getParam('projectId'))
    }
    if (this.tcid.get()) {
      this.subscribe('singleTimecard', this.tcid.get())
      if (this.subscriptionsReady()) {
        this.date.set(Timecards.findOne({ _id: this.tcid.get() })
          ? dayjs.utc(Timecards.findOne({ _id: this.tcid.get() }).date).toDate()
          : dayjs.utc().toDate())
      }
    }
  })
  this.autorun(() => {
    if (!this.tcid.get()) {
      handle = this.subscribe('myTimecardsForDate', { date: dayjs.utc(this.date.get()).format('YYYY-MM-DD') })
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
Template.tracktime.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const selectedProjectElement = templateInstance.$('.js-tracktime-projectselect > .js-target-project')
    let hours = templateInstance.$('#hours').val()

    if (!selectedProjectElement.val()) {
      selectedProjectElement.addClass('is-invalid')
      $.Toast.fire({ text: i18next.t('notifications.select_project'), icon: 'error' })
      return
    }
    if (!$('.js-tasksearch-input').val()) {
      $('.js-tasksearch-input').addClass('is-invalid')
      $.Toast.fire({ text: i18next.t('notifications.enter_task'), icon: 'error' })
      return
    }
    if (!hours) {
      $('#hours').addClass('is-invalid')
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
    const projectId = selectedProjectElement.val()
    const task = templateInstance.$('.js-tasksearch-input').val()
    const date = dayjs.utc($('#date').val(), getGlobalSetting('dateformatVerbose')).toDate()
    hours = templateInstance.math.eval(hours)

    if (getUserSetting('timeunit') === 'd') {
      hours *= (getUserSetting('hoursToDays') ? getUserSetting('hoursToDays') : getGlobalSetting('hoursToDays'))
    }
    const buttonLabel = $('.js-save').text()
    templateInstance.$('.js-save').text(i18next.t('navigation.saving'))
    templateInstance.$('.js-save').prop('disabled', true)
    if (templateInstance.tcid.get()) {
      Meteor.call('updateTimeCard', {
        _id: templateInstance.tcid.get(), projectId, date, hours, task,
      }, (error) => {
        if (error) {
          console.error(error)
        } else {
          $('.js-tasksearch-results').addClass('d-none')
          $.Toast.fire(i18next.t('notifications.time_entry_updated'))
          templateInstance.$(event.currentTarget).text(buttonLabel)
          templateInstance.$(event.currentTarget).prop('disabled', false)
          $('[data-toggle="tooltip"]').tooltip()
          if (templateInstance.data.tcid) {
            $('#edit-tc-entry-modal').modal('hide')
          }
        }
      })
    } else {
      Meteor.call('insertTimeCard', {
        projectId, date, hours, task,
      }, (error) => {
        if (error) {
          console.error(error)
        } else {
          templateInstance.$('.js-tasksearch-input').val('')
          templateInstance.$('.js-tasksearch-input').keyup()
          templateInstance.$('#hours').val('')
          templateInstance.$('.js-tasksearch-results').addClass('d-none')
          $.Toast.fire(i18next.t('notifications.time_entry_saved'))
          templateInstance.$('.js-save').text(buttonLabel)
          templateInstance.$('.js-save').prop('disabled', false)
          templateInstance.$('.js-show-timecards').slideDown('fast')
          templateInstance.$('[data-toggle="tooltip"]').tooltip()
          $('#edit-tc-entry-modal').modal('hide')
        }
      })
    }
  },
  'click .js-previous': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs.utc(templateInstance.date.get()).subtract(1, 'days').format('YYYY-MM-DD') })
    templateInstance.$('#hours').val('')
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
  },
  'click .js-next': (event, templateInstance) => {
    event.preventDefault()
    FlowRouter.setQueryParams({ date: dayjs.utc(templateInstance.date.get()).add(1, 'days').format('YYYY-MM-DD') })
    templateInstance.$('#hours').val('')
    templateInstance.$('.js-tasksearch-results').addClass('d-none')
  },
  'change .js-target-project': (event, templateInstance) => {
    templateInstance.projectId.set(templateInstance.$(event.currentTarget).val())
    templateInstance.$('.js-tasksearch').focus()
  },
  'change #date': (event, templateInstance) => {
    if ($(event.currentTarget).val()) {
      let date = dayjs.utc(templateInstance.$(event.currentTarget).val(), getGlobalSetting('dateformatVerbose'))
      if (!date.isValid()) {
        date = dayjs.utc()
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
    templateInstance.$('[data-toggle="tooltip"]').tooltip()
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
      }
    })
  },
  'click .js-open-calendar': (event, templateInstance) => {
    event.preventDefault()
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
})
Template.tracktime.helpers({
  date: () => dayjs.utc(Template.instance().date.get()).format(getGlobalSetting('dateformatVerbose')),
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
  totalTime: () => Template.instance().totalTime.get(),
  previousDay: () => dayjs.utc(Template.instance().date.get()).subtract(1, 'day').format(getGlobalSetting('dateformatVerbose')),
  nextDay: () => dayjs.utc(Template.instance().date.get()).add(1, 'day').format(getGlobalSetting('dateformatVerbose')),
  borderClass: () => (Template.instance().tcid.get()
    || (Template.instance().data.dateArg && Template.instance().data.dateArg.get())
    || (Template.instance().data.projectIdArg && Template.instance().data.projectIdArg.get()) ? '' : 'tab-borders'),
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
