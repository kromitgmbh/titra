import './settings.html'

Template.settings.helpers({
  name() {
    return Meteor.user().profile.name
  },
})

Template.settings.events({
  'click .js-save'(event) {
    event.preventDefault()
    Meteor.call('updateSettings', { name: $('#name').val() }, (error, result) => {
      if (error) {
        console.error(error)
      }
      console.log(result)
    })
  },
  'click .js-back'(event) {
    event.preventDefault()
    window.history.back()
  },
})
