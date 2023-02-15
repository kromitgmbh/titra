import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './pagination.html'

Template.pagination.onCreated(function paginationCreated() {
  this.currentPage = new ReactiveVar(1)
  this.numPages = new ReactiveVar(1)
  this.autorun(() => {
    this.numPages.set(Math.ceil(Number((this.data.totalEntries.get() / this.data.limit.get())))
      .toFixed(0))
    if (FlowRouter.getQueryParam('page')) {
      this.currentPage.set(FlowRouter.getQueryParam('page'))
      if (this.currentPage.get() > this.numPages.get()) {
        FlowRouter.setQueryParams({ page: null })
      }
    }
  })
})
Template.pagination.helpers({
  showPagination() {
    if (Template.instance().data.limit && Template.instance().data.totalEntries) {
      return Template.instance().data.limit.get() < Template.instance().data.totalEntries.get()
    }
    return false
  },
  getPages() {
    const pages = []
    if (Template.instance().data.limit && Template.instance().data.totalEntries) {
      for (let i = 0; i < Template.instance().numPages.get(); i++) {
        pages.push(Number(i + 1))
      }
    }
    return pages
  },
  activeClass(page) {
    return Number(page).toFixed(0) === Number(Template.instance().currentPage.get()).toFixed(0) ? 'active' : ''
  },
  disabledClass(type) {
    if (type === 'previous' && Number(Template.instance().currentPage.get()).toFixed(0) === Number(1).toFixed(0)) {
      return 'disabled'
    }
    if (type === 'next' && Number(Template.instance().currentPage.get()).toFixed(0) === Template.instance().numPages.get()) {
      return 'disabled'
    }
    if ((Template.instance().data.limit && Template.instance().data.totalEntries)) {
      return Template.instance().data.limit.get() < 0 || Template.instance().data.limit.get() > Template.instance().data.totalEntries.get() ? 'disabled' : ''
    }
    return 'disabled'
  },
})
Template.pagination.events({
  'click .js-previous': (event) => {
    event.preventDefault()
    Template.instance().currentPage.set(Number(Template.instance().currentPage.get()) - 1)
    FlowRouter.setQueryParams({ page: Template.instance().currentPage.get() })
  },
  'click .js-next': (event) => {
    event.preventDefault()
    Template.instance().currentPage.set(Number(Template.instance().currentPage.get()) + 1)
    FlowRouter.setQueryParams({ page: Template.instance().currentPage.get() })
  },
  'click .js-page-number': (event) => {
    event.preventDefault()
    Template.instance().currentPage.set($(event.currentTarget).text())
    FlowRouter.setQueryParams({ page: $(event.currentTarget).text() })
  },
})
