import { Template } from 'meteor/templating'
import moment from 'moment'
import { Projects } from '../../api/projects/projects.js'
import { Timecards } from '../../api/timecards/timecards.js'
import './tracktime.html'

Template.tracktime.onCreated( function createTrackTime() {
    this.subscribe('myprojects')
    this.autorun(() => {
      if(this.subscriptionsReady()){
        $('select').material_select()
        // $('#targetProject option')[0].selected = true;
      }
    })
})
Template.tracktime.helpers({
  projects() {
    return Projects.find()
  }
})
Template.tracktime.events({
  'click #save'(event){
    event.preventDefault()
    // console.log(Template.instance().data.picker.component.item.select.obj)
    // console.log(Template.instance().data.picker)
    Meteor.call('insertTimeCard', { projectId: $('#targetProject')[0].value,
      date: new Date(Date.parse($('#date')[0].value)), hours: $('#hours')[0].value }, (error, result) => {
        if(error){
          alert(error)
        }
        else{
          console.log('success')
        }
      })
  },
  'click #previous'(event){
    event.preventDefault()
    let picker = $('#date').pickadate('picker')
    // console.log(picker.get('select').obj)
    picker.set('select',new Date(moment(picker.get('select').obj).subtract(1,'days').utc()))
  },
  'click #next'(event){
    event.preventDefault()
    let picker = $('#date').pickadate('picker')
    // console.log(picker.get('select').obj)
    picker.set('select',new Date(moment(picker.get('select').obj).add(1,'days').utc()))
  }
})
Template.tracktime.onRendered(()=>{
  // $('#date')[0].value = new Date().toString('yyyy-MM-dd')
  $('#date').data('value',new Date())
  $('#date').pickadate({
    select: new Date(),
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 1
  })
  Materialize.updateTextFields()
  // picker.set('select', new Date())
  // Template.instance().data.picker = picker.pickadate('picker')
})
