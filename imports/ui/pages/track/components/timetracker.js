import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import dayjs from 'dayjs'
import preciseDiff from 'dayjs-precise-range'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './timetracker.html'
import { getGlobalSetting, getUserSetting } from '../../../../utils/frontend_helpers'
import CustomFields from '../../../../api/customfields/customfields'
import Projects from '../../../../api/projects/projects'

function pad(num, size) {
  const s = `0000${num}`
  return s.substr(s.length - size)
}

Template.timetracker.onCreated(function createTimeTracker() {
  this.timer = new ReactiveVar(null)
  this.task = new ReactiveVar()
  this.project = new ReactiveVar()
  this.subscribe('customfieldsForClass', { classname: 'time_entry' })
  this.customFields = new ReactiveVar([])
  if (getGlobalSetting('useStartTime')) {
    this.startTime = new ReactiveVar()
  }
  dayjs.extend(preciseDiff)
  this.autorun(() => {
    const storedTimer = getUserSetting('timer')
    const storedTask = getUserSetting('timer_task')
    const storedProject = getUserSetting('timer_project')
    const storedCustomFields = getUserSetting('timer_custom_fields')
    const storedStartTime = getUserSetting('timer_start_time')
    if (storedTask) {
      this.task.set(storedTask)
    }
    if (storedProject) {
      this.project.set(storedProject)
    }
    if (storedStartTime) {
      this.startTime.set(storedStartTime)
    }
    if (storedTimer) {
      this.timer.set(dayjs(storedTimer))
      if (!this.intervalHandle) {
        this.intervalHandle = Meteor.setInterval(() => {
          const duration = dayjs.preciseDiff(dayjs(), storedTimer, true)
          $('.js-timer').val(`${pad(duration.hours, 2)}:${pad(duration.minutes, 2)}:${pad(duration.seconds, 2)}`)
          if (document.title.codePointAt(0) !== '🔴'.codePointAt(0)) {
            document.title = `🔴 ${document.title}`
          }
        }, 1000)
      }
    }
    if (storedCustomFields) {
      this.customFields.set(storedCustomFields)
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
    const hours = (Number(duration.days * 24))
      + Number(duration.hours) + Number((duration.minutes / 60))
    const project = templateInstance.project.get()
    const task = templateInstance.task.get()
    if (templateInstance.customFields.get().length > 0) {
      for (const customField of templateInstance.customFields.get()) {
        $(`#${customField.name}`).val(customField.value)
      }
    }
    if (getGlobalSetting('useStartTime')) {
      $('#startTime').val(templateInstance.startTime.get())
    }
    $('#hours').val(Number(hours).toFixed(getUserSetting('precision'))).trigger('change')
    if (project) {
      $('.js-target-project').get(0).setAttribute('data-value', project)
      $('.js-target-project').val(Projects.findOne({ _id: project })?.name).trigger('change')
    }
    if (task) {
      $('.js-tasksearch-input').val(task)
    }
    Meteor.clearTimeout(templateInstance.intervalHandle)
    templateInstance.intervalHandle = undefined
    Meteor.call('setTimer', {}, (error) => {
      if (error) {
        console.error(error)
      } else if (document.title.codePointAt(0) === '🔴'.codePointAt(0)) {
        document.title = document.title.replace('🔴 ', '')
      }
    })
    templateInstance.timer.set(null)
    templateInstance.project.set(null)
    templateInstance.task.set(null)
    if (getGlobalSetting('useStartTime')) {
      templateInstance.startTime.set(null)
    }
  },
  'click .js-start': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.timer?.set(new Date())
    templateInstance.project?.set($('.js-target-project').val())
    templateInstance.task?.set($('.js-tasksearch-input').val())
    templateInstance.startTime?.set($('#startTime').val())
    const customFields = CustomFields.find().fetch()
    const customFieldsToSave = []
    if (customFields.length > 0) {
      for (const customField of customFields) {
        const customFieldEntry = {}
        customFieldEntry.name = customField.name
        customFieldEntry.value = $(`#${customField.name}`).val()
        customFieldsToSave.push(customFieldEntry)
      }
    }
    templateInstance.customFields?.set(customFieldsToSave)
    Meteor.call('setTimer', {
      timestamp: new Date(),
      project: $('.js-target-project').get(0).getAttribute('data-value'),
      task: $('.js-tasksearch-input').val(),
      startTime: $('#startTime').val(),
      customFields: customFieldsToSave,
    }, (error) => {
      if (error) {
        console.error(error)
      } else if (document.title.codePointAt(0) !== '🔴'.codePointAt(0)) {
        document.title = `🔴 ${document.title}`
      }
    })
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
