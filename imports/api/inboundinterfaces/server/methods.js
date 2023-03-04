import { check, Match } from 'meteor/check'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { adminAuthenticationMixin, transactionLogMixin } from '../../../utils/server_method_helpers'
import InboundInterfaces from '../inboundinterfaces.js'

const inboundinterfacesinsert = new ValidatedMethod({
  name: 'inboundinterfaces.insert',
  validate({
    name, description, globalinterfacesettings, localinterfacesettings, prepareRequest, processData,
  }) {
    check(name, String)
    check(description, String)
    check(globalinterfacesettings, Match.Maybe(Array))
    check(localinterfacesettings, Match.Maybe(Array))
    check(prepareRequest, Match.Maybe(String))
    check(processData, Match.Maybe(String))
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    name, description, globalinterfacesettings, localinterfacesettings, prepareRequest, processData,
  }) {
    await InboundInterfaces.insertAsync({
      name,
      description,
      globalinterfacesettings,
      localinterfacesettings,
      prepareRequest,
      processData,
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
    globalinterfacesettings,
    localinterfacesettings,
    prepareRequest,
    processData,
  }) {
    check(_id, String)
    check(name, String)
    check(description, String)
    check(globalinterfacesettings, Array)
    check(localinterfacesettings, Array)
    check(prepareRequest, String)
    check(processData, String)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run({
    _id,
    name,
    description,
    globalinterfacesettings,
    localinterfacesettings,
    prepareRequest,
    processData,
  }) {
    await InboundInterfaces.updateAsync({ _id }, {
      $set: {
        name,
        description,
        globalinterfacesettings,
        localinterfacesettings,
        prepareRequest,
        processData,
      },
    })
    return 'notifications.success'
  },
})
const inboundinterfacesremove = new ValidatedMethod({
  name: 'inboundinterfaces.remove',
  validate(_id) {
    check(_id, String)
  },
  mixins: [adminAuthenticationMixin, transactionLogMixin],
  async run(_id) {
    await InboundInterfaces.removeAsync({ _id })
    return 'notifications.success'
  },
})
export { inboundinterfacesinsert, inboundinterfacesupdate, inboundinterfacesremove }
