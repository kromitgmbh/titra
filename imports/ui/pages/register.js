import i18next from 'i18next'
import { FlowRouter } from 'meteor/kadira:flow-router'
import './register.html'

Template.register.events({
  'click #register': (event) => {
    event.preventDefault()
    if ($('#at-field-password').val() !== $('#at-field-password-again').val()) {
      $('#at-field-password').addClass('is-invalid')
      $('#at-field-password-again').addClass('is-invalid')
      $('.notification').text(i18next.t('login.password_mismatch'))
      document.querySelector('.notification').classList.toggle('d-none')
      return
    }
    if ($('#at-field-email').val() && $('#at-field-password').val() && $('#at-field-password-again').val()) {
      Accounts.createUser({
        email: $('#at-field-email').val(),
        password: $('#at-field-password').val(),
        profile: {
          name: $('#at-field-name').val(),
          currentLanguageProject: i18next.t('globals.project'),
          currentLanguageProjectDesc: i18next.t('project.first_project_desc')
        },
      }, (error) => {
        if (error) {
          $('.notification').text(i18next.t(`login.${error.error}`))
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
