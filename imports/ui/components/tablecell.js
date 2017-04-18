import './tablecell.html'

Template.tablecell.helpers({
  canBeModified() {
    return this.userId === Meteor.userId()
  },
})
Template.tablecell.onCreated(() => {
})

Template.tablecell.events({
  'click .js-delete-timecard': (event) => {
    event.preventDefault()
    console.log(Template.instance().data._id)
    Meteor.call('deleteTimeCard', { timecardId: Template.instance().data._id }, (error, result) => {
      if (!error) {
        $.notify('Time entry deleted')
      } else {
        console.error(error)
      }
    })
  },
})
