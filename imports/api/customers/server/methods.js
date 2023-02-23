import { ValidatedMethod } from 'meteor/mdg:validated-method'
import Projects from '../../projects/projects.js'
import { authenticationMixin } from '../../../utils/server_method_helpers.js'

const getAllCustomers = new ValidatedMethod({
  name: 'getAllCustomers',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return Projects.rawCollection().aggregate([{ $match: { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] } }, { $group: { _id: '$customer' } }]).toArray()
  },
})

export { getAllCustomers }
