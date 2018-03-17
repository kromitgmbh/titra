import Projects from '../../projects/projects.js'
// import Customers from '../customers.js'

Meteor.publish('projectCustomers', function projectCustomers({ projectId }) {
  check(projectId, String)
  const customers = []
  if (projectId === 'all') {
    Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).forEach((item) => {
      if (!customers.includes(item.customer)) {
        this.added('customers', Random.id(), { name: item.customer })
        customers.push(item.customer)
      }
    })
  } else if (!customers.includes(Projects.findOne({ _id: projectId }).customer)) {
    this.added('customers', Random.id(), { name: Projects.findOne({ _id: projectId }).customer })
    customers.push(Projects.findOne({ _id: projectId }).customer)
  }
  this.ready()
})
