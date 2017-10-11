import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/kadira:flow-router'
import 'jquery-serializejson'
import 'bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js'
import './editproject.html'
import Projects from '../../api/projects/projects.js'
import '../components/backbutton.js'
// import 'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css'

Template.editproject.onCreated(function editprojectSetup() {
  this.autorun(() => {
    const projectId = FlowRouter.getParam('id')
    if (projectId) {
      this.subscribe('singleProject', projectId)
    }
  } )
})
Template.editproject.onRendered(function editprojectRendered() {
  $('#colpick').colorpicker({
    format: 'hex',
  })
  this.autorun(() => {
    if (Projects.findOne()) {
      const userIds = Projects.findOne().team ? Projects.findOne().team : []
      $('#colpick').colorpicker('setValue', (Projects.findOne().color ? Projects.findOne().color : '#009688'))
      this.subscribe('projectTeam', { userIds })
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
      }, (error, result) => {
        if (!error) {
          $.notify('Project created successfully')
          FlowRouter.go('editproject', { id: result })
        } else {
          console.error(error)
        }
      })
    }
  },
  'click .js-backbutton': (event) => {
    event.preventDefault()
    FlowRouter.go('/list/projects')
  },
  'click #addNewMember': (event) => {
    event.preventDefault()
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const newmembermail = $('#newmembermail').val()
    if (newmembermail && emailRegex.test(newmembermail)) {
      Meteor.call('addTeamMember', { projectId: FlowRouter.getParam('id'), eMail: $('#newmembermail').val() }, (error, result) => {
        if (error) {
          $.notify({ message: error.error }, { type: 'danger' })
        } else {
          $('#newmembermail').val('')
          $.notify(result)
        }
      })
      $('#newmembermail').removeClass('is-invalid')
    } else {
      $('#newmembermail').addClass('is-invalid')
    }
  },
  'click #removeTeamMember': (event) => {
    event.preventDefault()
    const userId = event.currentTarget.parentElement.parentElement.id
    Meteor.call('removeTeamMember', { projectId: FlowRouter.getParam('id'), userId }, (error, result) => {
      if (error) {
        $.notify({ message: error }, { type: 'danger' })
      } else {
        $.notify(result)
      }
    })
  },
})
Template.editproject.helpers({
  // don't trust the linter, this has to stay!
  newProject: () => (FlowRouter.getParam('id') ? false : true),
  name: () => (Projects.findOne() ? Projects.findOne().name : false),
  desc: () => (Projects.findOne() ? Projects.findOne().desc : false),
  color: () => (Projects.findOne() ? Projects.findOne().color : '#009688'),
  customer: () => (Projects.findOne() ? Projects.findOne().customer : false),
  rate: () => (Projects.findOne() ? Projects.findOne().rate : false),
  wekanurl: () => (Projects.findOne() ? Projects.findOne().wekanurl : false),
  public: () => (Projects.findOne() ? Projects.findOne().public : false),
  team: () => {
    if (Projects.findOne() && Projects.findOne().team) {
      return Meteor.users.find({ _id: { $in: Projects.findOne().team } })
    }
    return false
  },
  disablePublic: () => Meteor.settings.public.disablePublic,
})
