import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { validateEmail } from '../../utils/frontend_helpers'
import { t } from '../../utils/i18n.js'
import './signIn.html'

function signIn(event, templateInstance) {
  event.preventDefault()
  if (!templateInstance.$('#at-field-email').val() || !validateEmail(templateInstance.$('#at-field-email').val())) {
    templateInstance.$('#at-field-email').addClass('is-invalid')
    return
  }
  if (!templateInstance.$('#at-field-password').val()) {
    templateInstance.$('#at-field-password').addClass('is-invalid')
    return
  }
  if (Meteor.loginWithLDAP) {
    Meteor.loginWithLDAP(templateInstance.$('#at-field-email').val(), templateInstance.$('#at-field-password').val(), {}, (error) => {
      templateInstance.$('#at-field-email').removeClass('is-invalid')
      templateInstance.$('#at-field-password').removeClass('is-invalid')
      if (error) {
        templateInstance.$('.notification').text(t(`login.${error.error}`))
        document.querySelector('.notification').classList.remove('d-none')
      } else {
        FlowRouter.go('projectlist')
      }
    })
  } else {
    Meteor.loginWithPassword(templateInstance.$('#at-field-email').val(), templateInstance.$('#at-field-password').val(), (error) => {
      templateInstance.$('#at-field-email').removeClass('is-invalid')
      templateInstance.$('#at-field-password').removeClass('is-invalid')
      if (error) {
        templateInstance.$('.notification').text(t(`login.${error.error}`))
        document.querySelector('.notification').classList.remove('d-none')
      } else {
        FlowRouter.go('projectlist')
      }
    })
  }
}

Template.signIn.events({
  'click #signIn': signIn,
  'keypress #at-field-password': (event, templateInstance) => {
    if (event.keyCode === 13) {
      signIn(event, templateInstance)
    }
  },
  'click #at-forgotPwd': (event, templateInstance) => {
    event.preventDefault()
    if (templateInstance.$('#at-field-email').val() && validateEmail(templateInstance.$('#at-field-email').val())) {
      Accounts.forgotPassword({ email: templateInstance.$('#at-field-email').val() }, (error) => {
        if (error) {
          templateInstance.$('.notification').text(t('login.email_unknown'))
          document.querySelector('.notification').classList.remove('d-none')
        } else {
          templateInstance.$('.notification').text(t('login.reset_password_mail'))
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
