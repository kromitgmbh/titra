import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'
import moment from 'moment'
import './tracktime.html'
import '../components/projectselect.js'
import '../components/tasksearch.js'

Template.tracktime.events({
  'click #save'(event, templateInstance) {
    event.preventDefault()
    // console.log(Template.instance().data.picker.component.item.select.obj)
    // console.log(Template.instance().data.picker)
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
          console.log(result)
        }
      })
  },
  'click #previous'(event) {
    event.preventDefault()
    const picker = $('#date').pickadate('picker')
    // console.log(picker.get('select').obj)
    picker.set('select', new Date(moment(picker.get('select').obj).subtract(1, 'days').utc()))
  },
  'click #next'(event) {
    event.preventDefault()
    const picker = $('#date').pickadate('picker')
    // console.log(picker.get('select').obj)
    picker.set('select', new Date(moment(picker.get('select').obj).add(1, 'days').utc()))
  },
})
Template.tracktime.onRendered(() => {
  // $('#date')[0].value = new Date().toString('yyyy-MM-dd')
  $('#date').data('value', new Date())
  $('#date').pickadate({
    select: new Date(),
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 1,
  })
  Materialize.updateTextFields()
  // picker.set('select', new Date())
  // Template.instance().data.picker = picker.pickadate('picker')
})
