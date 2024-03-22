import dayjs from 'dayjs'
import { Random } from 'meteor/random'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './userscomponent.html'
import { t } from '../../../../utils/i18n.js'
import { displayUserAvatar, showToast, validateEmail } from '../../../../utils/frontend_helpers'

Template.userscomponent.onCreated(function userscomponentCreated() {
  this.subscribe('userRoles')
  this.limit = new ReactiveVar(25)
})
Template.userscomponent.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.userSearch = new ReactiveVar('')
  templateInstance.autorun(() => {
    if (FlowRouter.getQueryParam('limit')) {
      templateInstance.limit.set(Number(FlowRouter.getQueryParam('limit')))
      templateInstance.$('#limitpicker').val(FlowRouter.getQueryParam('limit'))
    }
    templateInstance.subscribe('adminUserList', { limit: templateInstance.limit.get(), search: templateInstance.userSearch.get() })
  })
  Meteor.call('adminUserStats', (error, result) => {
    if (error) {
      console.error(error)
    } else {
      templateInstance.$('.js-total-users').text(result.totalUsers)
      templateInstance.$('.js-new-users').text(result.newUsers)
      templateInstance.$('.js-admin-users').text(result.adminUsers)
      templateInstance.$('.js-inactive-users').text(result.inactiveUsers)
    }
  })
})
Template.userscomponent.helpers({
  users: () => {
    const templateInstance = Template.instance()
    let query = {}
    const options = { sort: { createdAt: -1 } }
    if (templateInstance.userSearch?.get()) {
      query = {
        $or: [
          { 'profile.name': { $regex: `.*${templateInstance.userSearch?.get().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } },
          { 'emails.address': { $regex: `.*${templateInstance.userSearch?.get().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')}.*`, $options: 'i' } },
        ],
      }
    }
    if (templateInstance.limit?.get()) {
      options.limit = templateInstance.limit?.get()
    }
    return Meteor.users.find(query, options)
  },
  avatar: (meteorUser) => displayUserAvatar(meteorUser),
  dayjs: (date) => dayjs(date).format('DD.MM.YYYY (HH:mm)'),
})

Template.userscomponent.events({
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    if (confirm(t('administration.user_deletion_confirmation'))) {
      Meteor.call('adminDeleteUser', { userId: templateInstance.$(event.currentTarget).data('id') }, (error) => {
        if (error) {
          console.error(error)
        } else {
          showToast(t('administration.user_deleted'))
        }
      })
    }
  },
  'click #js-create-user': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#name').val()
    const email = templateInstance.$('#email').val()
    const password = templateInstance.$('#password').val()
    const isAdmin = templateInstance.$('#isAdmin').is(':checked')
    const currentLanguageProject = t('globals.project')
    const currentLanguageProjectDesc = t('project.first_project_desc')
    if (!validateEmail(email)) {
      templateInstance.$('#email').addClass('is-invalid')
      return
    }
    if (name && email && password) {
      Meteor.call('adminCreateUser', {
        name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc,
      }, (error) => {
        if (error) {
          console.error(error)
          showToast(error.message)
        } else {
          templateInstance.$('#name').val('')
          templateInstance.$('#email').val('')
          templateInstance.$('#password').val('')
          templateInstance.$('#isAdmin').prop('checked', false)
          showToast(t('administration.user_created'))
        }
        templateInstance.$('#email').removeClass('is-invalid')
      })
    }
  },
  'click .js-make-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: true }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('administration.user_updated'))
      }
    })
  },
  'click .js-remove-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: false }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('administration.user_updated'))
      }
    })
  },
  'click .js-generate-password': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#password').val(Random.id())
  },
  'click .js-activate-user': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserState', { userId: templateInstance.$(event.currentTarget).data('id'), inactive: true }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('administration.user_updated'))
      }
    })
  },
  'click .js-deactivate-user': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserState', { userId: templateInstance.$(event.currentTarget).data('id'), inactive: false }, (error) => {
      if (error) {
        console.error(error)
      } else {
        showToast(t('administration.user_updated'))
      }
    })
  },
  'focusout #userSearch': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.userSearch.set(event.currentTarget.value)
  },
  'keyup #userSearch': (event, templateInstance) => {
    event.preventDefault()
    if (event.keyCode === 13) {
      templateInstance.userSearch.set(event.currentTarget.value)
    }
  },
})
