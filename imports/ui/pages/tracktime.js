import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import bootstrap from 'bootstrap'
import TinyDatePicker from 'tiny-date-picker'
import 'tiny-date-picker/tiny-date-picker.css'
import { t } from '../../utils/i18n.js'
import Timecards from '../../api/timecards/timecards.js'
import Projects from '../../api/projects/projects.js'
import { getGlobalSetting, getUserSetting, showToast } from '../../utils/frontend_helpers.js'

import './tracktime.html'
import '../components/projectselect.js'
import '../components/tasksearch.js'
import '../components/timetracker.js'
import '../components/weektable.js'
import '../components/calendar.js'
import '../components/backbutton.js'
import '../components/usersearch.js'
import CustomFields from '../../api/customfields/customfields.js'

Template.tracktime.onRendered(() => {
  const templateInstance = Template.instance()
  if (!templateInstance.tinydatepicker) {
    templateInstance.tinydatepicker = TinyDatePicker(templateInstance.$('.js-date')[0], {
      format(date) {
        return date ? dayjs(date).format(getGlobalSetting('dateformatVerbose')) : dayjs.format(getGlobalSetting('dateformatVerbose'))
      },
      parse(date) {
        return dayjs(date, [getGlobalSetting('dateformatVerbose'), undefined]).toDate()
      },
      appendTo: templateInstance.firstNode,
      mode: 'dp-modal',
      dayOffset: getUserSetting('startOfWeek'),
    }).on('select', (_, dp) => {
      if (!dp.state.selectedDate) {
        templateInstance.$('.js-date').first().val(dayjs().format(getGlobalSetting('dateformatVerbose')))
      }
    })
  }
  templateInstance.autorun(() => {
    const timeEntry = templateInstance.time_entry.get()
    if (timeEntry) {
      Meteor.setTimeout(() => {
        for (const customfield of CustomFields.find({ classname: 'time_entry', possibleValues: { $exists: true } })) {
          if (templateInstance.firstNode) {
            templateInstance.$(`#${customfield.name}`).val(timeEntry[customfield.name])
          }
        }
      }, 500)
    }
  })
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
  this.time_entry = new ReactiveVar()
  this.subscribe('customfieldsForClass', { classname: 'time_entry' })
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
        this.time_entry.set(Timecards.findOne(this.tcid.get()))
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
          if ($('.js-tasksearch-input').length) {
            const project = Projects.findOne({ _id: this.projectId.get() })
            if (!project?.defaultTask) {
              $('.js-tasksearch-input').focus()
            } else {
              $('#hours').focus()
            }
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
    const customfields = {}
    templateInstance.$('.js-customfield').each((i, el) => { customfields[$(el).attr('id')] = $(el).val() })
    const buttonLabel = $('.js-save').first().text()
    const selectedProjectElement = templateInstance.$('.js-tracktime-projectselect > div > .js-target-project')
    templateInstance.projectId.set(selectedProjectElement.val())
    let hours = templateInstance.$('#hours').val()
    if (!templateInstance.projectId.get()) {
      selectedProjectElement.addClass('is-invalid')
      showToast(t('notifications.select_project'))
      return
    }
    if (!templateInstance.$('.js-tasksearch-input').val()) {
      templateInstance.$('.js-tasksearch-input').addClass('is-invalid')
      showToast(t('notifications.enter_task'))
      return
    }
    if (!hours) {
      templateInstance.$('#hours').addClass('is-invalid')
      showToast(t('notifications.enter_time'))
      return
    }
    try {
      hours = hours.replace(',', '.')
      templateInstance.math.eval(hours)
    } catch (exception) {
      showToast(t('notifications.check_time_input'))
      return
    }
    const projectId = templateInstance.projectId.get()
    const user = templateInstance.$('.js-usersearch-input')?.val() || Meteor.userId()
    const task = templateInstance.$('.js-tasksearch-input').val()
    const date = dayjs.utc(templateInstance.$('.js-date').val(), getGlobalSetting('dateformatVerbose')).toDate()
    if (getGlobalSetting('useStartTime') && !templateInstance.tcid?.get()) {
      if ($('#startTime').val()) {
        date.setHours($('#startTime').val().split(':')[0], $('#startTime').val().split(':')[1])
      } else {
        showToast(t('notifications.check_time_input'))
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
    templateInstance.$('.js-save').text(t('navigation.saving'))
    templateInstance.$('.js-save').prop('disabled', true)
    if (templateInstance.tcid.get()) {
      Meteor.call('updateTimeCard', {
        _id: templateInstance.tcid.get(), projectId, date, hours, task, customfields, user,
      }, (error) => {
        if (error) {
          console.error(error)
          if (typeof error.error === 'string') {
            showToast(t(error.error.replace('[', '').replace(']', '')))
          }
        } else {
          templateInstance.$('.js-tasksearch-results').addClass('d-none')
          showToast(t('notifications.time_entry_updated'))
          window.requestAnimationFrame(() => {
            templateInstance.$('[data-bs-toggle="tooltip"]').tooltip({
              container: templateInstance.firstNode,
              trigger: 'hover focus',
            })
          })
          if (templateInstance.data.tcid) {
            $('#edit-tc-entry-modal').modal('hide')
          }
          selectedProjectElement.removeClass('is-invalid')
        }
        templateInstance.$(event.currentTarget).text(buttonLabel)
        templateInstance.$(event.currentTarget).prop('disabled', false)
      })
    } else {
      Meteor.call('insertTimeCard', {
        projectId, date, hours, task, customfields, user,
      }, (error) => {
        if (error) {
          console.error(error)
          if (typeof error.error === 'string' && error.error.indexOf('notifications') >= 0) {
            showToast(t(error.error))
          }
        } else {
          templateInstance.$('.js-tasksearch-input').val('')
          templateInstance.$('.js-tasksearch-input').keyup()
          templateInstance.$('#hours').val('')
          templateInstance.$('.js-tasksearch-results').addClass('d-none')
          showToast(t('notifications.time_entry_saved'))
          templateInstance.$('.js-show-timecards').slideDown('fast')
          templateInstance.$('[data-bs-toggle="tooltip"]').tooltip()
          $('#edit-tc-entry-modal').modal('hide')
          selectedProjectElement.removeClass('is-invalid')
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
    const project = Projects.findOne({ _id: templateInstance.projectId.get() })
    if (!project?.defaultTask) {
      templateInstance.$('.js-tasksearch').first().focus()
    }
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
      templateInstance.$('[data-bs-toggle="tooltip"]').tooltip({
        container: templateInstance.firstNode,
        trigger: 'hover focus',
      })
    })
  },
  'click .js-time-row': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-time-row').each((index, element) => {
      bootstrap.Popover.getInstance(element)?.hide()
    })
    const timerowpopover = bootstrap.Popover
      .getOrCreateInstance(templateInstance.$(event.currentTarget), {
        trigger: 'manual',
        container: templateInstance.$('form'),
        html: true,
        content: templateInstance.$(event.currentTarget).children('.js-popover-content').html(),
      })
    timerowpopover.show()
  },
  'click .js-delete-time-entry': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-time-row').each((index, element) => {
      bootstrap.Popover.getInstance(element)?.hide()
    })
    const timecardId = event.currentTarget.href.split('/').pop()
    Meteor.call('deleteTimeCard', { timecardId }, (error, result) => {
      if (!error) {
        showToast(t('notifications.time_entry_deleted'))
      } else {
        console.error(error)
        if (typeof error.error === 'string') {
          showToast(t(error.error.replace('[', '').replace(']', '')))
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
    templateInstance.$('.js-time-row').each((index, element) => {
      bootstrap.Popover.getInstance(element)?.hide()
    })
    templateInstance.edittcid.set(event.currentTarget.href.split('/').pop())
    new bootstrap.Modal(templateInstance.$('#edit-tc-entry-modal')[0], { focus: false }).show()
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
  task: () => {
    const project = Projects.findOne({ _id: Template.instance().projectId.get() })
    const timecard = Timecards.findOne({ _id: Template.instance().tcid.get() })
    if (!timecard && project?.defaultTask) {
      return project.defaultTask
    }
    return timecard ? timecard?.task : false
  },
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
  startTime: () => dayjs(Template.instance().date.get()).format('HH:mm'),
  customfields: () => CustomFields.find({ classname: 'time_entry' }),
  getCustomFieldValue: (fieldId) => (Template.instance().time_entry.get()
    ? Template.instance().time_entry.get()[fieldId] : false),
  logForOtherUsers: () => {
    if(getGlobalSetting('enableLogForOtherUsers') && Template?.instance()?.projectId?.get()) {
      const targetProject = Projects.findOne({ _id: Template.instance().projectId.get() })
      if (targetProject
          && (targetProject.userId === Meteor.userId()
              || targetProject.admins?.indexOf(Meteor.userId()) >= 0)) {
        return true;
      }
    }
    return false;
  }
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
