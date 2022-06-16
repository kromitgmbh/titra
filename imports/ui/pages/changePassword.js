import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { showToast, validatePassword } from '../../utils/frontend_helpers.js'
import './changePassword.html'
import { t } from '../../utils/i18n.js'

Template.changePassword.events({
  'click #changePassword': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-password').val() !== templateInstance.$('#at-field-password-again').val()) {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      templateInstance.$('#at-field-password-again').addClass('is-invalid')
      templateInstance.$('.notification').text(t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if (FlowRouter.getParam('token') && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      const passwordValidation = validatePassword(templateInstance.$('#at-field-password').val())
      if (!passwordValidation.valid) {
        templateInstance.$('#at-field-password').addClass('is-invalid')
        templateInstance.$('#at-field-password-again').addClass('is-invalid')
        templateInstance.$('.notification').text(passwordValidation.message)
        document.querySelector('.notification').classList.toggle('d-none')
        return
      }
      Accounts.resetPassword(FlowRouter.getParam('token'), templateInstance.$('#at-field-password').val(), (error) => {
        if (error) {
          templateInstance.$('.notification').text(t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          showToast(t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    } else if (Meteor.user() && templateInstance.$('#at-field-current-password').val() && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      const passwordValidation = validatePassword(templateInstance.$('#at-field-password').val())
      if (!passwordValidation.valid) {
        templateInstance.$('#at-field-password').addClass('is-invalid')
        templateInstance.$('#at-field-password-again').addClass('is-invalid')
        templateInstance.$('.notification').text(passwordValidation.message)
        document.querySelector('.notification').classList.toggle('d-none')
        return
      }
      Accounts.changePassword(templateInstance.$('#at-field-current-password').val(), templateInstance.$('#at-field-password').val(), (error) => {
        if (error) {
          templateInstance.$('.notification').text(t(`login.${error.error}`))
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
          showToast(t('notifications.password_changed'))
          FlowRouter.go('projectlist')
        }
      })
    }
  },
  'keyup #at-field-password': (event, templateInstance) => {
    event.preventDefault()
    const validetedPW = validatePassword(templateInstance.$('#at-field-password').val())
    templateInstance.$('.js-password-feedback').text(validetedPW.message)
    if (validetedPW.valid) {
      templateInstance.$('#at-field-password').removeClass('is-invalid')
      templateInstance.$('#at-field-password-again').removeClass('is-invalid')
      templateInstance.$('.js-password-feedback').removeClass('invalid-feedback')
      templateInstance.$('.js-password-feedback').addClass('valid-feedback')
      templateInstance.$('.js-password-feedback').removeClass('hide')
    } else {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      templateInstance.$('.js-password-feedback').removeClass('valid-feedback')
      templateInstance.$('.js-password-feedback').addClass('invalid-feedback')
      templateInstance.$('.js-password-feedback').removeClass('hide')
      templateInstance.$('.js-password-feedback').addClass('d-block')
    }
  },
})
Template.changePassword.helpers({
  hasTokenSet: () => FlowRouter.getParam('token'),
})
