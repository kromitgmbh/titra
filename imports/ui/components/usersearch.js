import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './usersearch.html'
import Timecards from '../../api/timecards/timecards.js'

Template.usersearch.events({
  'mousedown .js-usersearch-result': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-usersearch-input').val(templateInstance.$(event.currentTarget).children('.js-usersearch-user-name').text())
    templateInstance.$('.js-usersearch-results').addClass('d-none')
    templateInstance.$('.js-usersearch-input').removeClass('is-invalid')
    if ($('#tasks')) {
      $('#tasks').focus()
    }
  },
  'focus .js-usersearch-input': (event, templateInstance) => {
    templateInstance.$('.js-usersearch-results').removeClass('d-none')
    templateInstance.$('.js-usersearch-input').removeClass('is-invalid')
  },
  'blur .js-usersearch-input': (event, templateInstance) => {
    if (!event.relatedTarget || $(event.relatedTarget).is($('.js-target-project').first())) {
      templateInstance.$('.js-usersearch-results').addClass('d-none')
    }
  },
  'keydown .js-usersearch-input': (event, templateInstance) => {
    if (event.keyCode === 13) {
      event.preventDefault()
      event.stopPropagation()
      if ($('#tasks') && templateInstance.$('.js-usersearch-input').val()) {
        templateInstance.$('.js-usersearch-results').addClass('d-none')
        $('#tasks').focus()
      }
    }
  },
  'keyup .js-usersearch-input': (event, templateInstance) => {
    if (event.keyCode === 40) {
      event.preventDefault()
      templateInstance.$('.js-usersearch-results').removeClass('d-none')
      templateInstance.$(templateInstance.$('.js-usersearch-result')[0]).focus()
    } else if (event.keyCode === 27) {
      templateInstance.$('.js-usersearch-results').addClass('d-none')
    } else {
      templateInstance.$('.js-usersearch-results').removeClass('d-none')
    }
  },
  'keyup .js-usersearch-result': (event, templateInstance) => {
    event.preventDefault()
    event.stopPropagation()
    // enter key
    if (event.keyCode === 13) {
      templateInstance.$('.js-usersearch-input').val(templateInstance.$(event.currentTarget).children('.js-usersearch-user-name').text())
      templateInstance.$('.js-usersearch-results').addClass('d-none')
      if ($('#tasks')) {
        $('#tasks').focus()
      }
    } else if ((event.keyCode === 40 || event.keyCode === 9) // tab or down key
      && event.currentTarget.nextElementSibling) {
      templateInstance.$(event.currentTarget.nextElementSibling).focus()
    } else if (event.keyCode === 38 && event.currentTarget.previousElementSibling) { // up key
      templateInstance.$(event.currentTarget.previousElementSibling).focus()
    } else if (event.keyCode === 27) { // escape key
      templateInstance.$('.js-usersearch-results').addClass('d-none')
      templateInstance.$('.js-usersearch-input').focus()
    }
  },
})

Template.usersearch.onCreated(function usersearchcreated() {
  this.users = new ReactiveVar()
  this.autorun(() => {
    let tcid
    if (this.data.tcid && this.data.tcid.get()) {
      tcid = this.data.tcid.get()
    } else if (FlowRouter.getParam('tcid')) {
      tcid = FlowRouter.getParam('tcid')
    }
    if (tcid) {
      const handle = this.subscribe('singleTimecard', tcid)
      if (handle.ready()) {
        this.$('.js-usersearch-input').val(Timecards.findOne({ _id: tcid }).user)
      }
    }
  })
  this.autorun(() => {
    const loadUsers = (projectId) => {
      Meteor.call('getProjectUsers', { projectId }, (error, result) => {
        this.users.set(result)
      })
    }
    if (FlowRouter.getParam('projectId')) {
      loadUsers(FlowRouter.getParam('projectId'))
    }
    if (this.data.projectId.get()) {
      loadUsers(this.data.projectId.get())
    }
  })
})
Template.usersearch.helpers({
  getMail: (user) => {
    if (user.emails) {
      return user.emails[0].address
    }
    return ''
  },
  users: () => Template.instance().users.get(),
  projectId: () => Template.instance()?.data?.projectId,
})
