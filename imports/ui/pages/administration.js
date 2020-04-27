import dayjs from 'dayjs'
import { Random } from 'meteor/random'
import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './administration.html'
import { Globalsettings } from '../../api/globalsettings/globalsettings'
import { displayUserAvatar, validateEmail } from '../../utils/frontend_helpers'
import '../components/limitpicker.js'

Template.administration.onCreated(function administrationCreated() {
  this.limit = new ReactiveVar(25)
  this.autorun(() => {
    if (FlowRouter.getQueryParam('limit')) {
      this.limit.set(Number(FlowRouter.getQueryParam('limit')))
      this.$('#limitpicker').val(FlowRouter.getQueryParam('limit'))
    }
    this.subscribe('adminUserList', { limit: this.limit.get() })
  })
})

Template.administration.helpers({
  users: () => Meteor.users.find({}, { sort: { createdAt: -1 } }),
  avatar: (meteorUser) => displayUserAvatar(meteorUser),
  dayjs: (date) => dayjs(date).format('DD.MM.YYYY (HH:mm)'),
  globalsettings: () => Globalsettings.find(),
  stringify: (string) => string.toString(),
  isTextArea: (setting) => setting.type === 'textarea',
})

Template.administration.events({
  'click .js-delete': (event, templateInstance) => {
    event.preventDefault()
    $.ConfirmBox.fire(i18next.t('administration.user_deletion_confirmation')).then((result) => {
      if (result.value) {
        Meteor.call('adminDeleteUser', { userId: templateInstance.$(event.currentTarget).data('id') }, (error, result) => {
          if (error) {
            console.error(error)
          } else {
            $.Toast.fire({ text: i18next.t('administration.user_deleted'), icon: 'success' })
          }
        })
      }
    })
  },
  'click #js-create-user': (event, templateInstance) => {
    event.preventDefault()
    const name = templateInstance.$('#name').val()
    const email = templateInstance.$('#email').val()
    const password = templateInstance.$('#password').val()
    const isAdmin = templateInstance.$('#isAdmin').is(':checked')
    const currentLanguageProject = i18next.t('globals.project')
    const currentLanguageProjectDesc = i18next.t('project.first_project_desc')
    if (!validateEmail(email)) {
      templateInstance.$('#email').addClass('is-invalid')
      return
    }
    if (name && email && password) {
      Meteor.call('adminCreateUser', {
        name, email, password, isAdmin, currentLanguageProject, currentLanguageProjectDesc
      }, (error) => {
        if (error) {
          console.error(error)
          $.Toast.fire({ text: error.message, icon: 'error' })
        } else {
          templateInstance.$('#name').val('')
          templateInstance.$('#email').val('')
          templateInstance.$('#password').val('')
          templateInstance.$('#isAdmin').prop('checked', false)
          $.Toast.fire({ text: i18next.t('administration.user_created'), icon: 'success' })
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
        $.Toast.fire(i18next.t('administration.user_updated'))
      }
    })
  },
  'click .js-remove-admin': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('adminToggleUserAdmin', { userId: templateInstance.$(event.currentTarget).data('id'), isAdmin: false }, (error) => {
      if (error) {
        console.error(error)
      } else {
        $.Toast.fire(i18next.t('administration.user_updated'))
      }
    })
  },
  'click .js-generate-password': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('#password').val(Random.id())
  },
  'click #reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetSettings', (error) => {
      if (error) {
        console.error(error)
      } else {
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-save': (event, templateInstance) => {
    event.preventDefault()
    const settingsArray = []
    for (const element of templateInstance.$('.js-setting-input')) {
      const { name } = element
      let value = templateInstance.$(element).val()
      if (element.type === 'number') {
        value = Number(value)
      } else if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      }
      settingsArray.push({ name, value })
    }
    Meteor.call('updateGlobalSettings', settingsArray, (error) => {
      if (error) {
        console.error(error)
      } else {
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
      }
    })
  },
  'click .js-reset': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('resetGlobalsetting', { name: templateInstance.$(event.currentTarget).data('setting-name') }, (error) => {
      if (error) {
        console.error(error)
      } else {
        $.Toast.fire(i18next.t('notifications.settings_saved_success'))
      }
    })
  }
})
