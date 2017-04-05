import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/kadira:flow-router'
import 'jquery-serializejson'
import './editproject.html'
import Projects from '../../api/projects/projects.js'
import '../components/backbutton.js'

Template.editproject.onCreated(function editprojectSetup() {
  this.subscribe('singleProject', FlowRouter.getParam('id'))
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      // Materialize.updateTextFields()
    }
  })
})
Template.editproject.events({
  'click #save': (event, templateInstance) => {
    event.preventDefault()
    // console.log(templateInstance.$('#editProjectForm').serializeJSON())
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
  name: () => (Projects.findOne() ? Projects.findOne().name : false),
  desc: () => (Projects.findOne() ? Projects.findOne().desc : false),
  customer: () => (Projects.findOne() ? Projects.findOne().customer : false),
  rate: () => (Projects.findOne() ? Projects.findOne().rate : false),
  wekanurl: () => (Projects.findOne() ? Projects.findOne().wekanurl : false),
  public: () => (Projects.findOne() ? Projects.findOne().public : false),
})
