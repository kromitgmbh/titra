import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { t } from '../../utils/i18n.js'
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
})
Template.register.helpers({
  email: () => FlowRouter.getQueryParam('email'),
})
