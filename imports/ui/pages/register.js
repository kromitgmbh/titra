import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './register.html'

Template.register.events({
  'click #register': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-password').val() !== templateInstance.$('#at-field-password-again').val()) {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      templateInstance.$('#at-field-password-again').addClass('is-invalid')
      templateInstance.$('.notification').text(i18next.t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if (templateInstance.$('#at-field-email').val() && templateInstance.$('#at-field-password').val() && templateInstance.$('#at-field-password-again').val()) {
      Accounts.createUser({
        email: templateInstance.$('#at-field-email').val(),
        password: templateInstance.$('#at-field-password').val(),
        profile: {
          name: templateInstance.$('#at-field-name').val(),
          currentLanguageProject: i18next.t('globals.project'),
          currentLanguageProjectDesc: i18next.t('project.first_project_desc'),
        },
      }, (error) => {
        console.error(error)
        if (error && error.error !== 145546287) {
          templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
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
