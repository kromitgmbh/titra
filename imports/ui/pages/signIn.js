import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './signIn.html'

Template.signIn.events({
  'click #signIn': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-email').val() && templateInstance.$('#at-field-password').val()) {
      Meteor.loginWithPassword(templateInstance.$('#at-field-email').val(), templateInstance.$('#at-field-password').val(), (error) => {
        if (error) {
          templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          FlowRouter.go('projectlist')
        }
      })
    }
  },
  'click #at-forgotPwd': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-email').val()) {
      Accounts.forgotPassword({ email: templateInstance.$('#at-field-email').val() }, (error) => {
        if (error) {
          templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          templateInstance.$('.notification').text(i18next.t('login.reset_password_mail'))
          document.querySelector('.notification').classList.remove('d-none')
        }
      })
    }
  },
})
