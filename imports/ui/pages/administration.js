import moment from 'moment'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import './administration.html'
import { displayUserAvatar } from '../../utils/frontend_helpers'

Template.administration.onCreated(function administrationCreated() {
  this.subscribe('adminUserList')
})

Template.administration.helpers({
  users: () => Meteor.users.find({}, { sort: { createdAt: -1 } }),
  avatar: (meteorUser) => displayUserAvatar(meteorUser),
  moment: (date) => moment(date).format('DD.MM.YYYY (HH:mm)'),
})

Template.administration.events({
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    if (confirm(i18next.t('administration.user_deletion_confirmation'))) {
      Meteor.call('adminDeleteUser', { userId: templateInstance.$(event.currentTarget).data('id') }, (error, result) => {
        if (error) {
          console.error(error)
        } else {
          $.notify({ message: i18next.t('administration.user_deleted') }, { type: 'success' })
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
    const currentLanguageProject = i18next.t('globals.project')
    const currentLanguageProjectDesc = i18next.t('project.first_project_desc')
    if (name && email && password) {
      Meteor.call('adminCreateUser', {
        name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc
      }, (error) => {
        if (error) {
          console.error(error)
        } else {
          templateInstance.$('#name').val('')
          templateInstance.$('#email').val('')
          templateInstance.$('#password').val('')
          templateInstance.$('#isAdmin').prop('checked', false)
          $.notify({ message: i18next.t('administration.user_created') }, { type: 'success' })
        }
      })
    }
  },
  'click .js-make-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: true }, (error) => {
      if (error) {
        console.error(error)
      } else {
        $.notify({ message: i18next.t('administration.user_updated') }, { type: 'success' })
      }
    })
  },
  'click .js-remove-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: false }, (error) => {
      if (error) {
        console.error(error)
      } else {
        $.notify({ message: i18next.t('administration.user_updated') }, { type: 'success' })
      }
    })
  },
  'click .js-generate-password': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#password').val(Random.id())
  },
})
