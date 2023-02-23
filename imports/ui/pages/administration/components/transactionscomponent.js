import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import dayjs from 'dayjs'
import './transactionscomponent.html'
import '../../details/components/limitpicker.js'
import '../../../shared components/datatable.js'
import { addToolTipToTableCell } from '../../../../utils/frontend_helpers.js'
import { t } from '../../../../utils/i18n.js'
import Transactions from '../../../../api/transactions/transactions'

function addToolTipToTableCellWithLabel(value, label) {
  if (value) {
    const toolTipElement = $('<span/>').text(label)
    toolTipElement.addClass('js-tooltip')
    toolTipElement.attr('data-bs-toggle', 'tooltip')
    toolTipElement.attr('data-bs-placement', 'left')
    toolTipElement.attr('title', value)
    return toolTipElement.get(0).outerHTML
  }
  return ''
}

Template.transactionscomponent.onCreated(function transactionscomponentCreated() {
  this.limit = new ReactiveVar(25)
  this.transactions = new ReactiveVar([])
  this.filter = new ReactiveVar()
  this.columns = new ReactiveVar([{
    name: t('transactions.user'),
    editable: false,
    format: (value) => addToolTipToTableCellWithLabel(value, value ? JSON.parse(value)?.name : ''),
  }, {
    name: t('transactions.method'),
    editable: false,
    format: addToolTipToTableCell,
  }, {
    name: t('transactions.payload'),
    editable: false,
    format: addToolTipToTableCell,
  }, {
    name: t('transactions.timestamp'),
    editable: false,
    format: addToolTipToTableCell,
  }])
  this.autorun(() => {
    this.subscribe('allTransactions', { limit: this.limit?.get(), filter: this.filter?.get() })
  })
  this.autorun(() => {
    if (this.subscriptionsReady()) {
      this.transactions
        .set(Transactions.find().fetch()
          .map((transaction) => [
            transaction.user,
            transaction.method,
            transaction.args,
            dayjs(transaction.timestamp).format(),
          ]))
    }
  })
})
Template.transactionscomponent.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    if (FlowRouter.getQueryParam('limit')) {
      templateInstance.limit.set(Number(FlowRouter.getQueryParam('limit')))
      templateInstance.$('#limitpicker').val(FlowRouter.getQueryParam('limit'))
    }
  })
})

Template.transactionscomponent.helpers({
  columns: () => Template.instance()?.columns,
  transactions: () => Template.instance()?.transactions,
})

Template.transactionscomponent.events({
  'change .js-transaction-search': (event, templateInstance) => {
    templateInstance.filter.set(event.target.value)
  },
})
