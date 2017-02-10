import { FlowRouter } from 'meteor/kadira:flow-router'
import 'jquery-serializejson'
import './editproject.html'
import Projects from '../../api/projects/projects.js'

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
    console.log(templateInstance.$('#editProjectForm').serializeJSON())
    if (FlowRouter.getParam('id')) {
      Meteor.call('updateProject', { projectId: FlowRouter.getParam('id'), projectArray: templateInstance.$('#editProjectForm').serializeArray() }, (error, result) => {
        if (!error) {
          console.log(result)
        } else {
          console.error(error)
        }
      })
    } else {
      Meteor.call('createProject', { projectArray: templateInstance.$('#editProjectForm').serializeArray() }, (error, result) => {
        if (!error) {
          console.log(result)
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
  name: () => {
    return Projects.findOne() ? Projects.findOne().name : false
  },
  desc: () => {
    return Projects.findOne() ? Projects.findOne().desc : false
  },
  customer: () => {
    return Projects.findOne() ? Projects.findOne().customer : false
  },
  rate: () => {
    return Projects.findOne() ? Projects.findOne().rate : false
  },
  public: () => {
    return Projects.findOne() ? Projects.findOne().public : false
  },
})
