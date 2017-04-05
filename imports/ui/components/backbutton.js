import './backbutton.html'

Template.backbutton.events({
  'click .js-backbutton': (event) => {
    event.preventDefault()
    window.history.back()
  },
})
