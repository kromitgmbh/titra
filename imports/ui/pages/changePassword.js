import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './changePassword.html'

Template.changePassword.events({
  'click #changePassword': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-password').val() !== templateInstance.$('#at-field-password-again').val()) {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      templateInstance.$('#at-field-password-again').addClass('is-invalid')
      templateInstance.$('.notification').text(i18next.t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if (FlowRouter.getParam('token') && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      Accounts.resetPassword(FlowRouter.getParam('token'), templateInstance.$('#at-field-password').val(), (error) => {
        if (error) {
          templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          $.Toast.fire(i18next.t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    } else if (Meteor.user() && templateInstance.$('#at-field-current-password').val() && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      Accounts.changePassword(templateInstance.$('#at-field-current-password').val(), templateInstance.$('#at-field-password').val(), (error) => {
        if (error) {
          templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          $.Toast.fire(i18next.t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    }
  },
})
Template.changePassword.helpers({
  hasTokenSet: () => FlowRouter.getParam('token'),
})
