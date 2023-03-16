import { check, Match } from 'meteor/check'
import { NodeVM } from 'vm2'
import fetch from 'node-fetch'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { adminAuthenticationMixin, authenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers'
import InboundInterfaces from '../inboundinterfaces.js'
import Projects from '../../projects/projects.js'
import { getGlobalSetting } from '../../../utils/frontend_helpers'

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
const getInboundInterfaces = new ValidatedMethod({
  name: 'inboundinterfaces.get',
  validate: null,
  mixins: [authenticationMixin],
  async run() {
    return InboundInterfaces
      .find({ active: true }, { fields: { processData: 0, prepareRequest: 0 } }).fetch()
  },
})
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
        getGlobalSetting,
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
