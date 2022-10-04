import { Match } from 'meteor/check'
import Projects from '../../projects/projects.js'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.publish('projectCustomers', function projectCustomers({ projectId }) {
  check(projectId, Match.OneOf(String, Array))
  checkAuthentication(this)
  const customers = []
  if (projectId.includes('all')) {
    Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).forEach((item) => {
      if (item.customer && !customers.includes(item.customer)) {
        this.added('customers', item.customer, { name: item.customer })
        customers.push(item.customer)
      }
    })
  } else if (projectId instanceof Array) {
    Projects.find(
      {
        _id: { _in: projectId },
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { _id: 1 },
    ).forEach((item) => {
      if (item.customer && !customers.includes(item.customer)) {
        this.added('customers', item.customer, { name: item.customer })
        customers.push(item.customer)
      }
    })
  } else if (Projects.findOne({ _id: projectId }).customer
    && !customers.includes(Projects.findOne({ _id: projectId }).customer)) {
    this.added('customers', Projects.findOne({ _id: projectId }).customer, { name: Projects.findOne({ _id: projectId }).customer })
    customers.push(Projects.findOne({ _id: projectId }).customer)
  }
  this.ready()
})
