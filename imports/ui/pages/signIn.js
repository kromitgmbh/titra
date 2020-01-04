import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './signIn.html'

Template.signIn.events({
  'click #signIn': (event) => {
    event.preventDefault()
    if ($('#at-field-email').val() && $('#at-field-password').val()) {
      Meteor.loginWithPassword($('#at-field-email').val(), $('#at-field-password').val(), (error) => {
        if (error) {
          $('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          FlowRouter.go('projectlist')
        }
      })
    }
  },
  'click #at-forgotPwd': (event) => {
    event.preventDefault()
    if ($('#at-field-email').val()) {
      Accounts.forgotPassword({ email: $('#at-field-email').val() }, (error) => {
        if (error) {
          $('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          $('.notification').text(i18next.t('login.reset_password_mail'))
          document.querySelector('.notification').classList.remove('d-none')
        }
      })
    }
  },
})
