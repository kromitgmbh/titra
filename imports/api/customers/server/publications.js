import Projects from '../../projects/projects.js'
// import Customers from '../customers.js'

Meteor.publish('projectCustomers', function projectCustomers({ projectId }) {
  check(projectId, String)
  if (projectId === 'all') {
    Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).forEach((item) => {
      this.added('customers', Random.id(), { name: item.customer })
    })
  } else {
    this.added('customers', Random.id(), { name: Projects.findOne({ _id: projectId }).customer })
  }
  this.ready()
})
