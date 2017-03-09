import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import moment from 'moment'
import Timecards from '../../api/timecards/timecards.js'
import './tracktime.html'
import '../components/projectselect.js'
import '../components/tasksearch.js'
import '../components/timetracker.js'
import '../components/backbutton.js'

Template.tracktime.events({
  'click .js-save'(event, templateInstance) {
    event.preventDefault()
    // console.log(Template.instance().data.picker.component.item.select.obj)
    // console.log(Template.instance().data.picker)
    if (FlowRouter.getParam('tcid')) {
      Meteor.call('updateTimeCard', { _id: FlowRouter.getParam('tcid'),
        date: new Date(Date.parse($('#date').val())),
        hours: $('#hours').val(),
        task: templateInstance.$('.js-tasksearch-input').val() }, (error, result) => {
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
      Meteor.call('insertTimeCard', { projectId: $('#targetProject').val(),
        date: new Date(Date.parse($('#date').val())),
        hours: $('#hours').val(),
        task: templateInstance.$('.js-tasksearch-input').val() }, (error, result) => {
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
  'click .js-previous'(event, templateInstance) {
    event.preventDefault()
    templateInstance.date.set(new Date(moment(templateInstance.date.get()).subtract(1, 'days').utc()))
    $('#hours').val('')
    $('.js-tasksearch-results').hide()
  },
  'click .js-next'(event, templateInstance) {
    event.preventDefault()
    templateInstance.date.set(new Date(moment(templateInstance.date.get()).add(1, 'days').utc()))
    $('#hours').val('')
    $('.js-tasksearch-results').hide()
  },
  'change #targetProject'(event, templateInstance) {
    templateInstance.data.projectId.set($(event.currentTarget).val())
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
  task: () => {
    return Timecards.findOne() ? Timecards.findOne().task : false
  },
  hours: () => {
    return Timecards.findOne() ? Timecards.findOne().hours : false
  },
})
Template.tracktime.onCreated(function tracktimeCreated() {
  this.date = new ReactiveVar(new Date())
  this.data.projectId = new ReactiveVar(FlowRouter.getParam('projectId'))
  if (FlowRouter.getParam('tcid')) {
    this.subscribe('singleTimecard', FlowRouter.getParam('tcid'))
    this.autorun(() => {
      if (this.subscriptionsReady()) {
        this.date.set(Timecards.findOne() ? Timecards.findOne().date : new Date())
      }
    })
  }
})
