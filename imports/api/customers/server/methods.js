import { ValidatedMethod } from 'meteor/mdg:validated-method'
import Projects from '../../projects/projects.js'
import { authenticationMixin } from '../../../utils/server_method_helpers.js'

/**
 * A ValidatedMethod that retrieves all customers from the Projects collection.
 *
 * @typedef {Object} ValidatedMethod
 * @property {string} name - The name of the method.
 * @property {function} validate - The validation function for the method.
 * @property {Array} mixins - An array of mixins to be applied to the method.
 * @property {function} run - The function to be executed when the method is called.
 *
 * @function getAllCustomers
 * @returns {Promise<Array>} - A promise that resolves to an array of customer objects.
 */
const getAllCustomers = new ValidatedMethod({
  name: 'getAllCustomers',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return Projects.rawCollection().aggregate([{ $match: { $or: [{ userId: this.userId }, { public: true }, { team: this.userId }] } }, { $group: { _id: '$customer' } }]).toArray()
  },
})

export { getAllCustomers }
