import moment from 'moment'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { saveAs } from 'file-saver'
import Timecards from '../../api/timecards/timecards.js'
import './timecardlist.html'
import '../components/periodpicker.js'

const base64toBlob = (base64Data, contentTypeArgument) => {
  check(base64Data, String)
  check(contentTypeArgument, Match.OneOf(undefined, null, String))
  const contentType = contentTypeArgument || ''
  const sliceSize = 1024
  const byteCharacters = atob(base64Data)
  const bytesLength = byteCharacters.length
  const slicesCount = Math.ceil(bytesLength / sliceSize)
  const byteArrays = new Array(slicesCount)

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize
    const end = Math.min(begin + sliceSize, bytesLength)

    const bytes = new Array(end - begin)
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0)
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes)
  }
  return new Blob(byteArrays, { type: contentType })
}

Template.timecardlist.onCreated(function createTimeCardList() {
  this.period = new ReactiveVar('currentMonth')
  this.autorun(() => {
    this.subscribe('projectTimecards', { projectId: FlowRouter.getParam('projectId'), period: this.period.get() })
  })
})
Template.timecardlist.helpers({
  timecards() {
    return Timecards.findOne() ? Timecards.find() : false
  },
  prettify(date) {
    return moment(date).format('DD.MM.YYYY')
  },
  projectId() {
    return FlowRouter.getParam('projectId')
  },
})

Template.timecardlist.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
  },
  'change #targetProject': (event) => {
    FlowRouter.go(`/list/timecards/${$(event.currentTarget).val()}`)
  },
  'click .js-delete-timecard': (event) => {
    event.preventDefault()
    Meteor.call('deleteTimeCard', { timecardId: event.currentTarget.parentNode.id }, (error, result) => {
      if (!error) {
        console.log(result)
      } else {
        console.error(error)
      }
    })
  },
  'click #export': (event) => {
    event.preventDefault()
    Meteor.call('export', { projectId: $('#targetProject').val(), timePeriod: $('#period').val() }, (error, result) => {
      if (!error) {
        saveAs(new Blob([result], { type: 'application/vnd.ms-excel' }), `titra_export_${moment().format('YYYYMMDD-HHmm')}.xls`)
        // console.log(result)
      } else {
        console.error(error)
      }
    })
  },
})
