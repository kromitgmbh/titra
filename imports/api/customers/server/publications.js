import { Match } from 'meteor/check'
import Projects from '../../projects/projects.js'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'

/**
@function projectCustomers
@param {Object} options - An object containing the projectId or an array of projectIds.
@param {string|Array} options.projectId - The id of the project(s) to retrieve customers for.
@throws {Error} If projectId is not a string or array, or if the user is not authenticated.
@returns {void} - This publication returns 'customers' to the client for the provided project id.
*/
Meteor.publish('projectCustomers', async function projectCustomers({ projectId }) {
  check(projectId, Match.OneOf(String, Array))
  await checkAuthentication(this)
  const customers = []
  if (projectId.includes('all')) {
    await Projects.find(
      { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] },
      { _id: 1 },
    ).forEachAsync((item) => {
      if (item.customer && !customers.includes(item.customer)) {
        this.added('customers', item.customer, { name: item.customer })
        customers.push(item.customer)
      }
    })
  } else if (projectId instanceof Array) {
    await Projects.find(
      {
        _id: { _in: projectId },
        $or: [{ userId: this.userId }, { public: true }, { team: this.userId }],
      },
      { _id: 1 },
    ).forEachAsync((item) => {
      if (item.customer && !customers.includes(item.customer)) {
        this.added('customers', item.customer, { name: item.customer })
        customers.push(item.customer)
      }
    })
  } else {
    const project = await Projects.findOneAsync({ _id: projectId })
    if (project.customer && !customers.includes(project.customer)) {
      this.added('customers', project.customer, { name: project.customer })
      customers.push(project.customer)
    }
  }
  this.ready()
})
