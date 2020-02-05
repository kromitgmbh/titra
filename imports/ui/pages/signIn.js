import i18next from 'i18next'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { validateEmail } from '../../utils/frontend_helpers'
import './signIn.html'

Template.signIn.events({
  'click #signIn': (event, templateInstance) => {
    event.preventDefault()
    if (!templateInstance.$('#at-field-email').val() || !validateEmail(templateInstance.$('#at-field-email').val())) {
      templateInstance.$('#at-field-email').addClass('is-invalid')
      return
    }
    if (!templateInstance.$('#at-field-password').val()) {
      templateInstance.$('#at-field-password').addClass('is-invalid')
      return
    }
    Meteor.loginWithPassword(templateInstance.$('#at-field-email').val(), templateInstance.$('#at-field-password').val(), (error) => {
      templateInstance.$('#at-field-email').removeClass('is-invalid')
      templateInstance.$('#at-field-password').removeClass('is-invalid')
      if (error) {
        templateInstance.$('.notification').text(i18next.t(`login.${error.error}`))
        document.querySelector('.notification').classList.remove('d-none')
      } else {
        FlowRouter.go('projectlist')
      }
    })
  },
  'click #at-forgotPwd': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-email').val() && validateEmail(templateInstance.$('#at-field-email').val())) {
      Accounts.forgotPassword({ email: templateInstance.$('#at-field-email').val() }, (error) => {
        if (error) {
          templateInstance.$('.notification').text(i18next.t('login.email_unknown'))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          templateInstance.$('.notification').text(i18next.t('login.reset_password_mail'))
          document.querySelector('.notification').classList.remove('d-none')
          templateInstance.$('#at-field-email').removeClass('is-invalid')
          templateInstance.$('#at-field-password').removeClass('is-invalid')
        }
      })
    } else {
      templateInstance.$('#at-field-email').addClass('is-invalid')
    }
  },
})
