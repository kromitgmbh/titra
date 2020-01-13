import i18next from 'i18next'
import './tablecell.html'

Template.tablecell.helpers({
  canBeModified() {
    return this.userId === Meteor.userId()
  },
})
Template.tablecell.onRendered(function tablecellRendered() {
  this.autorun(() => {
    if (window.BootstrapLoaded.get()) {
      $('[data-toggle="tooltip"]').tooltip()
    }
  })
})

Template.tablecell.events({
  'click .js-delete-timecard': (event) => {
    event.preventDefault()
    Meteor.call('deleteTimeCard', { timecardId: Template.instance().data._id }, (error, result) => {
      if (!error) {
        $.notify(i18next.t('notifications.time_entry_deleted'))
      } else {
        console.error(error)
      }
    })
  },
})
