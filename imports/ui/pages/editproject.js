import { Meteor } from 'meteor/meteor'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import 'jquery-serializejson'
import '@simonwep/pickr/dist/themes/monolith.min.css'
import Pickr from '@simonwep/pickr/dist/pickr.min'
import i18next from 'i18next'
import './editproject.html'
import Projects from '../../api/projects/projects.js'
import '../components/backbutton.js'

function validateWekanUrl() {
  const wekanUrl = $('#wekanurl').val()
  if (!wekanUrl) {
    $('#wekanurl').addClass('is-invalid')
    return
  }
  const authToken = wekanUrl.match(/authToken=(.*)/)[1]
  const url = wekanUrl.substring(0, wekanUrl.indexOf('export?'))
  const templateInstance = Template.instance()
  $('#wekan-status').html('<i class="fa fa-spinner fa-spin"></i>')
  $('#wekanurl').prop('disabled', true)
  try {
    HTTP.get(`${url}lists`, { headers: { Authorization: `Bearer ${authToken}` } }, (error, result) => {
      $('#wekan-status').removeClass()
      $('#wekanurl').prop('disabled', false)
      if (error || result.data.error) {
        $('#wekanurl').addClass('is-invalid')
        $('#wekan-status').html('<i class="fa fa-times"></i>')
      } else {
        templateInstance.wekanLists.set(result.data)
        $('#wekanurl').removeClass('is-invalid')
        $('#wekan-status').html('<i class="fa fa-check"></i>')
      }
    })
  } catch (error) {
    console.error(error)
    $('#wekanurl').addClass('is-invalid')
    $('#wekan-status').html('check')
  }
}

Template.editproject.onCreated(function editprojectSetup() {
  this.autorun(() => {
    const projectId = FlowRouter.getParam('id')
    if (projectId) {
      this.handle = this.subscribe('singleProject', projectId)
    }
    this.deletion = new ReactiveVar(false)
  })
  this.wekanLists = new ReactiveVar()
})
Template.editproject.onRendered(() => {
  const templateInstance = Template.instance()
  const pickrOptions = {
    el: '#pickr',
    theme: 'monolith',
    lockOpacity: true,
    comparison: false,
    position: 'left-start',
    components: {
      preview: true,
      opacity: false,
      hue: true,
      interaction: {
        hex: false,
        input: false,
        clear: false,
        save: false,
      },
    },
  }
  if (!FlowRouter.getParam('id')) {
    templateInstance.color = `#${(`000000${Math.floor(0x1000000 * Math.random()).toString(16)}`).slice(-6)}`
    $('#color').val(templateInstance.color)
    pickrOptions.default = templateInstance.color
  }
  templateInstance.pickr = Pickr.create(pickrOptions)
  templateInstance.pickr.on('change', (color) => {
    $('#color').val(color.toHEXA().toString())
  })
  import('quill').then((quillImport) => {
    import('quill/dist/quill.snow.css')
    templateInstance.quill = new quillImport.default('#richDesc', {
      theme: 'snow',
    })
    if (Projects.findOne() && Projects.findOne().desc instanceof Object && templateInstance.quill) {
      templateInstance.quill.setContents(Projects.findOne().desc)
    } else if (Projects.findOne() && Projects.findOne().desc && templateInstance.quill) {
      templateInstance.quill.setText(Projects.findOne().desc)
    }
  })

  templateInstance.autorun(() => {
    if (templateInstance.handle && templateInstance.handle.ready()) {
      if (Projects.findOne()) {
        templateInstance.pickr.setColor(Projects.findOne().color
          ? Projects.findOne().color : templateInstance.color)
        if (Projects.findOne().desc instanceof Object && templateInstance.quill) {
          templateInstance.quill.setContents(Projects.findOne().desc)
        } else if (Projects.findOne().desc && templateInstance.quill) {
          templateInstance.quill.setText(Projects.findOne().desc)
        }
      } else if (FlowRouter.getRouteName() !== 'createProject' && !templateInstance.deletion) {
        FlowRouter.go('404')
      }
    }
    if (Projects.findOne()) {
      const userIds = Projects.findOne().team ? Projects.findOne().team : []
      templateInstance.subscribe('projectTeam', { userIds })
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
    if (Meteor.user().profile.timeunit === 'd') {
      templateInstance.$('#target').val(Number(templateInstance.$('#target').val()) * 8)
    }
    const projectArray = templateInstance.$('#editProjectForm').serializeArray()
    projectArray.push({ name: 'desc', value: Template.instance().quill.getContents() })
    if (Meteor.user().profile.timeunit === 'd') {
      templateInstance.$('#target').val(templateInstance.$('#target').val() * (Meteor.user().profile.hoursToDays ? Meteor.user().profile.hoursToDays : 8))
    }
    if (FlowRouter.getParam('id')) {
      Meteor.call('updateProject', {
        projectId: FlowRouter.getParam('id'),
        projectArray,
      }, (error) => {
        if (!error) {
          $('#name').removeClass('is-invalid')
          $.notify(i18next.t('notifications.project_update_success'))
        } else {
          console.error(error)
        }
      })
    } else {
      Meteor.call('createProject', {
        projectArray,
      }, (error, result) => {
        if (!error) {
          $.notify(i18next.t('notifications.project_create_success'))
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
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const newmembermail = $('#newmembermail').val()
    if (newmembermail && emailRegex.test(newmembermail)) {
      Meteor.call('addTeamMember', { projectId: FlowRouter.getParam('id'), eMail: $('#newmembermail').val() }, (error, result) => {
        if (error) {
          $.notify({ message: i18next.t(error.error) }, { type: 'danger' })
        } else {
          $('#newmembermail').val('')
          $.notify(i18next.t(result))
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
        $.notify({ message: i18next.t(error.error) }, { type: 'danger' })
      } else {
        $.notify(i18next.t(result))
      }
    })
  },
  'click .js-delete-project': (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (confirm(i18next.t('notifications.project_delete_confirm'))) {
      Template.instance().deletion.set(true)
      Meteor.call('deleteProject', { projectId: FlowRouter.getParam('id') }, (error) => {
        if (!error) {
          FlowRouter.go('projectlist')
          $.notify(i18next.t('notifications.project_delete_success'))
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
        $.notify(i18next.t('notifications.project_archive_success'))
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
        $.notify(i18next.t('notifications.project_restore_success'))
      } else {
        console.error(error)
      }
    })
  },
  'change #color': (event) => {
    if (!Template.instance().pickr.setColor($(event.currentTarget).val())) {
      $('#color').addClass('is-invalid')
    } else {
      $('#color').removeClass('is-invalid')
    }
  },
  'change #wekanurl': (event) => {
    event.preventDefault()
    validateWekanUrl()
  },
  'click #wekan-status': (event) => {
    event.preventDefault()
    validateWekanUrl()
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
  wekanLists: () => Template.instance().wekanLists.get(),
  public: () => (Projects.findOne() ? Projects.findOne().public : false),
  team: () => {
    if (Projects.findOne() && Projects.findOne().team) {
      return Meteor.users.find({ _id: { $in: Projects.findOne().team } })
    }
    return false
  },
  projectId: () => FlowRouter.getParam('id'),
  disablePublic: () => Meteor.settings.public.disablePublic,
  archived: (_id) => (Projects.findOne({ _id }) ? Projects.findOne({ _id }).archived : false),
  target: () => (Projects.findOne() ? Projects.findOne().target : false),
})

Template.editproject.onDestroyed(function editprojectDestroyed() {
  this.pickr.destroy()
  delete this.pickr
})
