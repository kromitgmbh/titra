import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/kadira:flow-router'
import 'jquery-serializejson'
import 'bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js'
import './editproject.html'
import Projects from '../../api/projects/projects.js'
import '../components/backbutton.js'
// import 'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css'

Template.editproject.onCreated(function editprojectSetup() {
  if (FlowRouter.getParam('id')) {
    this.subscribe('singleProject', FlowRouter.getParam('id'))
  }
})
Template.editproject.onRendered(function editprojectRendered() {
  $('#colpick').colorpicker({
    format: 'hex',
  })
  this.autorun(() => {
    if (Projects.findOne()) {
      $('#colpick').colorpicker('setValue', (Projects.findOne().color ? Projects.findOne().color : '#009688'))
    }
  })
})
Template.editproject.events({
  'click #save': (event, templateInstance) => {
    event.preventDefault()
    if (FlowRouter.getParam('id')) {
      Meteor.call('updateProject', {
        projectId: FlowRouter.getParam('id'),
        projectArray: templateInstance.$('#editProjectForm').serializeArray(),
      }, (error) => {
        if (!error) {
          $.notify('Project updated successfully')
        } else {
          console.error(error)
        }
      })
    } else {
      Meteor.call('createProject', {
        projectArray: templateInstance.$('#editProjectForm').serializeArray(),
      }, (error) => {
        if (!error) {
          $.notify('Project created successfully')
        } else {
          console.error(error)
        }
      })
    }
    FlowRouter.go('/list/projects')
  },
  'click #back': (event) => {
    event.preventDefault()
    window.history.back()
  },
})
Template.editproject.helpers({
  new: () => (FlowRouter.getParam('id') || true),
  name: () => (Projects.findOne() ? Projects.findOne().name : false),
  desc: () => (Projects.findOne() ? Projects.findOne().desc : false),
  color: () => (Projects.findOne() ? Projects.findOne().color : '#009688'),
  customer: () => (Projects.findOne() ? Projects.findOne().customer : false),
  rate: () => (Projects.findOne() ? Projects.findOne().rate : false),
  wekanurl: () => (Projects.findOne() ? Projects.findOne().wekanurl : false),
  public: () => (Projects.findOne() ? Projects.findOne().public : false),
})
