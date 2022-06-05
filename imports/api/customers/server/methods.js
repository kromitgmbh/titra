import Projects from '../../projects/projects.js'
import { checkAuthentication } from '../../../utils/server_method_helpers.js'

Meteor.methods({
  getAllCustomers: function getAllCustomers() {
    checkAuthentication(this)
    return Projects.rawCollection().aggregate([{ $match: { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] } }, { $group: { _id: '$customer' } }]).toArray()
  },
})
