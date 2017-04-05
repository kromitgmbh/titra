import './connectioncheck.html'

Template.connectioncheck.events({
  'click #connectButton': (event) => {
    event.preventDefault()
    Meteor.reconnect()
  },
})
Template.connectioncheck.onCreated(function connectioncheckCreated() {
  this.autorun(() => {
    if (Meteor.status().connected) {
      $('#offlineModal').modal('hide')
    } else if ((Meteor.status().status === 'failed' || Meteor.status().status === 'waiting')
      && Meteor.status().retryCount > 1) {
      $('#offlineModal').modal('show')
    }
  })
})
