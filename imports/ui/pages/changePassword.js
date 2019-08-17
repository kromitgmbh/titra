import i18next from 'i18next'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './changePassword.html'

Template.changePassword.events({
  'click #changePassword': (event) => {
    event.preventDefault()
    if ($('#at-field-password').val() !== $('#at-field-password-again').val()) {
      $('#at-field-password').addClass('is-invalid')
      $('#at-field-password-again').addClass('is-invalid')
      $('.notification').text(i18next.t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if (FlowRouter.getParam('token') && $('#at-field-password').val() && $('#at-field-password-again').val()) {
      Accounts.resetPassword(FlowRouter.getParam('token'), $('#at-field-password').val(), (error) => {
        if (error) {
          $('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          $.notify(i18next.t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    } else if (Meteor.user() && $('#at-field-current-password').val() && $('#at-field-password').val() && $('#at-field-password-again').val()) {
      Accounts.changePassword($('#at-field-current-password').val(), $('#at-field-password').val(), (error) => {
        if (error) {
          $('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          $.notify(i18next.t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    }
  },
})
Template.changePassword.helpers({
  hasTokenSet: () => FlowRouter.getParam('token'),
})
