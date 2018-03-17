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
      this.handle = this.subscribe('singleProject', projectId)
    }
    this.deletion = new ReactiveVar(false)
  })
})
Template.editproject.onRendered(function editprojectRendered() {
  this.color = `#${(`000000${Math.floor(0x1000000 * Math.random()).toString(16)}`).slice(-6)}`
  $('#colpick').colorpicker({
    format: 'hex',
    color: this.color,
  })
  this.autorun(() => {
    if (this.handle && this.handle.ready()) {
      if (Projects.findOne()) {
        $('#colpick').colorpicker('setValue', (Projects.findOne().color ? Projects.findOne().color : this.color))
      } else if (FlowRouter.getRouteName() !== 'createProject' && !this.deletion) {
        FlowRouter.go('404')
      }
    }
    if (Projects.findOne()) {
      const userIds = Projects.findOne().team ? Projects.findOne().team : []
      this.subscribe('projectTeam', { userIds })
    }
  })
})
Template.editproject.events({
  'click #save': (event, templateInstance) => {
    event.preventDefault()
    if (!$('#name').val()) {
      $('#name').addClass('is-invalid')
      return
    }
    if (FlowRouter.getParam('id')) {
      Meteor.call('updateProject', {
        projectId: FlowRouter.getParam('id'),
        projectArray: templateInstance.$('#editProjectForm').serializeArray(),
      }, (error) => {
        if (!error) {
          $('#name').removeClass('is-invalid')
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
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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
  'click .js-delete-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm('Do you really want to delete this project?')) {
      Template.instance().deletion.set(true)
      Meteor.call('deleteProject', { projectId: FlowRouter.getParam('id') }, (error) => {
        if (!error) {
          FlowRouter.go('projectlist')
          $.notify('Project deleted successfully')
        } else {
          console.error(error)
        }
      })
    }
  },
  'click .js-archive-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    Meteor.call('archiveProject', { projectId: FlowRouter.getParam('id') }, (error) => {
      if (!error) {
        $.notify('Project archived successfully')
      } else {
        console.error(error)
      }
    })
  },
  'click .js-restore-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    Meteor.call('restoreProject', { projectId: FlowRouter.getParam('id') }, (error) => {
      if (!error) {
        $.notify('Project restored successfully')
      } else {
        console.error(error)
      }
    })
  },
})
Template.editproject.helpers({
  newProject: () => (!FlowRouter.getParam('id')),
  name: () => (Projects.findOne() ? Projects.findOne().name : false),
  desc: () => (Projects.findOne() ? Projects.findOne().desc : false),
  color: () => (Projects.findOne() ? Projects.findOne().color : Template.instance().color),
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
  projectId: () => FlowRouter.getParam('id'),
  disablePublic: () => Meteor.settings.public.disablePublic,
  archived: _id => (Projects.findOne({ _id }) ? Projects.findOne({ _id }).archived : false),
})
