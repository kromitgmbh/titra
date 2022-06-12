import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { t } from '../../utils/i18n.js'
import { validateEmail, validatePassword } from '../../utils/frontend_helpers.js' 
import './register.html'

Template.register.events({
  'click #register': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-password').val() !== templateInstance.$('#at-field-password-again').val()) {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      templateInstance.$('#at-field-password-again').addClass('is-invalid')
      templateInstance.$('.notification').text(t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if (templateInstance.$('#at-field-email').val() && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      if (!validateEmail(templateInstance.$('#at-field-email').val())) {
        templateInstance.$('#at-field-email').addClass('is-invalid')
        templateInstance.$('.notification').text(t('login.invalid_email'))
        document.querySelector('.notification').classList.toggle('d-none')
        return
      }
      const passwordValidation = validatePassword(templateInstance.$('#at-field-password').val())
      if (!passwordValidation.valid) {
        templateInstance.$('#at-field-password').addClass('is-invalid')
        templateInstance.$('#at-field-password-again').addClass('is-invalid')
        templateInstance.$('.notification').text(passwordValidation.message)
        document.querySelector('.notification').classList.toggle('d-none')
        return
      }
      Accounts.createUser({
        email: templateInstance.$('#at-field-email').val(),
        password: templateInstance.$('#at-field-password').val(),
        profile: {
          name: templateInstance.$('#at-field-name').val(),
          currentLanguageProject: t('globals.project'),
          currentLanguageProjectDesc: t('project.first_project_desc'),
        },
      }, (error) => {
        console.error(error)
        if (error && error.error !== 145546287) {
          templateInstance.$('.notification').text(`${t(`login.${error.error}`)} (${error.reason})`)
          document.querySelector('.notification').classList.toggle('d-none')
        } else {
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
Template.register.helpers({
  email: () => FlowRouter.getQueryParam('email'),
})
