import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import moment from 'moment'
import Timecards from '../../api/timecards/timecards.js'
import './tracktime.html'
import '../components/projectselect.js'
import '../components/tasksearch.js'
import '../components/timetracker.js'
import '../components/calendar.js'
import '../components/backbutton.js'

Template.tracktime.onCreated(function tracktimeCreated() {
  import('mathjs/core').then((core) => {
    this.math = core.default.create()
    import('mathjs/lib/expression/function').then((module) => {
      this.math.import(module.default)
    })
    import('mathjs/lib/function/arithmetic/add').then((module) => {
      this.math.import(module.default)
    })
    import('mathjs/lib/function/arithmetic/subtract').then((module) => {
      this.math.import(module.default)
    })
    import('mathjs/lib/function/arithmetic/multiply').then((module) => {
      this.math.import(module.default)
    })
    import('mathjs/lib/function/arithmetic/divide').then((module) => {
      this.math.import(module.default)
    })
  })
  this.date = new ReactiveVar(new Date())
  this.projectId = new ReactiveVar(FlowRouter.getParam('projectId'))
  if (FlowRouter.getParam('tcid')) {
    this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
    this.autorun(() => {
      if (this.subscriptionsReady()) {
        this.date.set(Timecards.findOne() ? Timecards.findOne().date : new Date())
      }
    })
  } else if (FlowRouter.getQueryParam('date')) {
    this.autorun(() => {
      this.date.set(FlowRouter.getQueryParam('date'))
    })
  }
})

Template.tracktime.events({
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    // console.log(Template.instance().data.picker.component.item.select.obj)
    // console.log(Template.instance().data.picker)
    try {
      templateInstance.math.eval($('#hours').val())
    } catch (exception) {
      $.notify({ message: 'Please check your input' }, { type: 'danger' })
      $('#hours').parent().addClass('has-danger')
      return
    }
    const projectId = templateInstance.$('#targetProject').val()
    const task = templateInstance.$('.js-tasksearch-input').val()
    const date = new Date(Date.parse($('#date').val()))
    let hours = templateInstance.math.eval($('#hours').val())
    if (Meteor.user().profile.timeunit === 'd') {
      hours = templateInstance.math.eval($('#hours').val() * (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8))
    }
    if (FlowRouter.getParam('tcid')) {
      Meteor.call('updateTimeCard', { _id: FlowRouter.getParam('tcid'), projectId, date, hours, task }, (error) => {
        if (error) {
          console.error(error)
        } else {
          $('.js-tasksearch-input').val('')
          $('#hours').val('')
          $('.js-tasksearch-results').hide()
          $.notify('Time entry updated successfully')
          window.history.back()
        }
      })
    } else {
      Meteor.call('insertTimeCard', { projectId: $('#targetProject').val(), date, hours, task }, (error) => {
        if (error) {
          console.error(error)
        } else {
          $('.js-tasksearch-input').val('')
          $('#hours').val('')
          $('.js-tasksearch-results').hide()
          $.notify('Time entry saved successfully')
        }
      })
    }
  },
  'click .js-previous': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.date.set(new Date(moment(templateInstance.date.get()).subtract(1, 'days').utc()))
    $('#hours').val(0)
    $('.js-tasksearch-results').hide()
  },
  'click .js-next': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.date.set(new Date(moment(templateInstance.date.get()).add(1, 'days').utc()))
    $('#hours').val(0)
    $('.js-tasksearch-results').hide()
  },
  'change #targetProject': (event, templateInstance) => {
    templateInstance.projectId.set($(event.currentTarget).val())
  },
  'change #date': (event, templateInstance) => {
    // we need this to correctly capture calender change events from the input
    templateInstance.date.set($(event.currentTarget).val())
  },
})
Template.tracktime.helpers({
  date: () => moment(Template.instance().date.get()).format('YYYY-MM-DD'),
  projectId: () => {
    if (FlowRouter.getParam('projectId')) {
      return FlowRouter.getParam('projectId')
    }
    return Timecards.findOne() ? Timecards.findOne().projectId : false
  },
  isEdit: () => FlowRouter.getParam('tcid'),
  task: () => (Timecards.findOne() ? Timecards.findOne().task : false),
  hours: () => (Timecards.findOne() ? Timecards.findOne().hours : false),
  showTracker: () => (Meteor.user() ? (Meteor.user().profile.timeunit !== 'd') : false),
})

Template.tracktimemain.onCreated(function tracktimeCreated() {
  this.timetrackview = new ReactiveVar(Meteor.user() ? Meteor.user().profile.timetrackview || 'd' : 'd')
  this.autorun(() => {
    if (FlowRouter.getParam('projectId')) {
      this.timetrackview.set('d')
    }
  })
})

Template.tracktimemain.helpers({
  showDay: () => (Template.instance().timetrackview.get() === 'd' ? 'active' : ''),
  showMonth: () => (Template.instance().timetrackview.get() === 'M' ? 'active' : ''),
})

Template.tracktimemain.events({
  'click .js-day': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.timetrackview.set('d')
  },
  'click .js-month': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.timetrackview.set('M')
    FlowRouter.setParams({ projectId: '' })
    FlowRouter.setQueryParams({ date: null })
  },
})
