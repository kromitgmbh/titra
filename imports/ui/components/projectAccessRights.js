import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './projectAccessRights.html'
import { t, i18nReady } from '../../utils/i18n.js'
import {
  validateEmail, getGlobalSetting, showToast,
} from '../../utils/frontend_helpers'
import Projects from '../../api/projects/projects.js'

Template.projectAccessRights.onCreated(function projectAccessRightsCreated() {
  this.project = new ReactiveVar()
  this.autorun(() => {
    if (this.data.projectId) {
      this.project.set(Projects.findOne({ _id: this.data.projectId }))
      this.handle = this.subscribe('singleProject', this.data.projectId)
      if (this.handle.ready()) {
        const userIds = this.project.get().team ? this.project.get().team : []
        this.subscribe('projectTeam', { userIds })
      }
    }
  })
})
Template.projectAccessRights.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (templateInstance.handle.ready() && templateInstance.project?.get() && i18nReady.get()) {
      const columns = [
        {
          name: t('globals.name'),
          editable: false,
          focusable: false,
        }, {
          name: t('project.access_rights'),
          editable: false,
          focusable: false,
          format: (value) => {
            if (value !== templateInstance.project?.get()?.userId) {
              return templateInstance.project?.get()?.admins?.indexOf(value) >= 0
                ? `<select class="form-select js-rw-rights" data-id="${value}"><option value="team">Team member</option><option value="admin" selected>Administrator</option></select>`
                : `<select class="form-select js-rw-rights" data-id="${value}"><option value="team" selected>Team member</option><option value="admin">Administrator</option></select>`
            }
            return t('project.owner')
          },
        }, {
          name: t('tracktime.actions'),
          editable: false,
          focusable: false,
          format: (value) => (value !== templateInstance.project?.get()?.userId
            ? `<a href="#removeMember" class="js-remove-team-member" data-id="${value}"><i class="fa fa-trash"></i></a>` : ''),
        }]
      const data = []
      data.push([
        Meteor.users.findOne({ _id: templateInstance.project?.get()?.userId })?.profile?.name,
        templateInstance.project?.get()?.userId,
        templateInstance.project?.get()?.userId])
      if (templateInstance.project.get()?.team) {
        for (const member of templateInstance.project.get().team) {
          const user = Meteor.users.findOne({ _id: member })
          if (user !== undefined) {
            data.push([user?.profile?.name, user?._id, user?._id])
          }
        }
      }
      if (!templateInstance.projectAccessRightsDataTable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              noDataMessage: t('tabular.sZeroRecords'),
              events: {
                onRemoveColumn() {
                  templateInstance.projectAccessRightsDataTable.refresh(data, columns)
                },
              },
            }
            try {
              window.requestAnimationFrame(() => {
                templateInstance.projectAccessRightsDataTable = new DataTable('#project-access-rights-table', datatableConfig)
                templateInstance.$('.dt-scrollable').height('+=4')
              })
            } catch (projectAccessRightsCreationError) {
              console.error(`Caught error: ${projectAccessRightsCreationError}`)
            }
          })
        })
      } else {
        try {
          templateInstance.projectAccessRightsDataTable.refresh(data, columns)
        } catch (projectAccessRefreshError) {
          console.error(`Caught error: ${projectAccessRefreshError}`)
        }
      }
    }
  })
})
Template.projectAccessRights.helpers({
  public: () => (Template.instance().project.get()
    ? Template.instance().project.get().public : false),
  disablePublic: () => getGlobalSetting('disablePublicProjects'),
})
Template.projectAccessRights.events({
  'click #addNewMember': (event, templateInstance) => {
    event.preventDefault()
    const newmembermail = templateInstance.$('#newmembermail').val()
    if (newmembermail && validateEmail(newmembermail)) {
      Meteor.call('addTeamMember', { projectId: FlowRouter.getParam('id'), eMail: templateInstance.$('#newmembermail').val() }, (error, result) => {
        if (error) {
          showToast(t(error.error))
        } else {
          templateInstance.$('#newmembermail').val('')
          showToast(t(result))
        }
      })
      templateInstance.$('#newmembermail').removeClass('is-invalid')
    } else {
      templateInstance.$('#newmembermail').addClass('is-invalid')
    }
  },
  'click .js-remove-team-member': (event, templateInstance) => {
    event.preventDefault()
    const userId = $(event.currentTarget).data('id')
    Meteor.call('removeTeamMember', { projectId: templateInstance.data.projectId, userId }, (error, result) => {
      if (error) {
        showToast(t(error.error))
      } else {
        showToast(t(result))
      }
    })
  },
  'change .js-rw-rights': (event, templateInstance) => {
    event.preventDefault()
    const userId = $(event.currentTarget).data('id')
    Meteor.call('changeProjectRole', { projectId: templateInstance.data.projectId, userId, administrator: $(event.currentTarget).val() === 'admin' }, (error, result) => {
      if (error) {
        showToast(t(error.error))
      } else {
        showToast(t(result))
      }
    })
  },
})

Template.projectAccessRights.onDestroyed(() => {
  try {
    Template.instance().projectAccessRightsDataTable?.destroy()
  } catch (error) {
    console.error(error)
  }
  Template.instance().projectAccessRightsDataTable = undefined
})
