import './export.html'
import '../components/projectselect.js'
import '../components/periodpicker.js'

Template.export.events({
  'click #export': (event) => {
    event.preventDefault()
    Meteor.call('export', { projectId: $('#targetProject').val(), timePeriod: $('#period').val() }, (error, result) => {
      if (!error) {
        console.log(result)
      } else {
        console.error(error)
      }
    })
  },
})
