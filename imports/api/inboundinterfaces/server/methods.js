import { check, Match } from 'meteor/check'
import { NodeVM } from 'vm2'
import fetch from 'node-fetch'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import {
  adminAuthenticationMixin, authenticationMixin, transactionLogMixin, getGlobalSettingAsync,
} from '../../../utils/server_method_helpers'
import InboundInterfaces from '../inboundinterfaces.js'
import Projects from '../../projects/projects.js'

/**
 * Method for inserting a new inbound interface.
 *
 * @method inboundinterfacesinsert
 * @param {Object} options - The options for inserting a new inbound interface.
 * @param {string} options.name - The name of the inbound interface.
 * @param {string} options.description - The description of the inbound interface.
 * @param {string} [options.processData] - The process data of the inbound interface (optional).
 * @param {boolean} options.active - The active status of the inbound interface.
 * @returns {string} - The success notification message.
 */
const inboundinterfacesinsert = new ValidatedMethod({
  name: 'inboundinterfaces.insert',
  validate({
    name, description, processData, active,
  }) {
    check(name, String)
    check(description, String)
    check(processData, Match.Maybe(String))
    check(active, Boolean)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    name, description, processData, active,
  }) {
    await InboundInterfaces.insertAsync({
      name,
      description,
      processData,
      active,
    })
    return 'notifications.success'
  },
})
/**
 * Updates an inbound interface.
 *
 * @method inboundinterfacesupdate
 * @param {Object} options - The options for updating the inbound interface.
 * @param {string} options._id - The ID of the inbound interface.
 * @param {string} options.name - The name of the inbound interface.
 * @param {string} options.description - The description of the inbound interface.
 * @param {string} options.processData - The process data of the inbound interface.
 * @param {boolean} options.active - The active status of the inbound interface.
 * @returns {string} - The success notification message.
 */
const inboundinterfacesupdate = new ValidatedMethod({
  name: 'inboundinterfaces.update',
  validate({
    _id,
    name,
    description,
    processData,
    active,
  }) {
    check(_id, String)
    check(name, String)
    check(description, String)
    check(processData, String)
    check(active, Boolean)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    _id,
    name,
    description,
    processData,
    active,
  }) {
    await InboundInterfaces.updateAsync({ _id }, {
      $set: {
        name,
        description,
        processData,
        active,
      },
    })
    return 'notifications.success'
  },
})
/**
 * Removes an inbound interface.
 *
 * @method inboundinterfacesremove
 * @param {Object} options - The options for removing the inbound interface.
 * @param {string} options._id - The ID of the inbound interface to be removed.
 * @returns {string} - A success notification message.
 */
const inboundinterfacesremove = new ValidatedMethod({
  name: 'inboundinterfaces.remove',
  validate({ _id }) {
    check(_id, String)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({ _id }) {
    await InboundInterfaces.removeAsync({ _id })
    return 'notifications.success'
  },
})
/**
 * Retrieves the active inbound interfaces.
 *
 * @method inboundinterfaces.get
 * @mixes authenticationMixin
 * @returns {Array} An array of active inbound interfaces.
 */
const getInboundInterfaces = new ValidatedMethod({
  name: 'inboundinterfaces.get',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return InboundInterfaces
      .find({ active: true }, { fields: { processData: 0, prepareRequest: 0 } }).fetchAsync()
  },
})
/**
 * Retrieves tasks from the inbound interface.
 *
 * @method inboundinterfaces.getTasks
 * @param {Object} options - The options for retrieving tasks.
 * @param {string} options._id - The ID of the inbound interface.
 * @param {string} options.projectId - The ID of the project.
 * @throws {Meteor.Error} If there is an error retrieving tasks.
 * @returns {Array} An array of tasks.
 */
const getTasksFromInboundInterface = new ValidatedMethod({
  name: 'inboundinterfaces.getTasks',
  validate({ _id, projectId }) {
    check(_id, String)
    check(projectId, Match.Maybe(String))
  },
  mixins: [authenticationMixin],
  async run({ _id, projectId }) {
    const inboundInterface = await InboundInterfaces.findOneAsync({ _id })
    const meteorUser = await Meteor.users.findOneAsync({ _id: this.userId })
    const project = await Projects.findOneAsync({ _id: projectId })
    const vm = new NodeVM({
      wrapper: 'none',
      timeout: 1000,
      sandbox: {
        user: meteorUser.profile,
        project,
        fetch,
        getGlobalSettingAsync,
      },
      require: {
        external: true,
        builtin: ['*'],
      },
    })
    try {
      const result = await vm.run(inboundInterface.processData)
      if (!result || !(result instanceof Array)) {
        throw new Meteor.Error('notifications.inboundInterfaceError')
      }
      return result
    } catch (error) {
      throw new Meteor.Error(error.message)
    }
  },
})
export {
  inboundinterfacesinsert,
  inboundinterfacesupdate,
  inboundinterfacesremove,
  getInboundInterfaces,
  getTasksFromInboundInterface,
}
