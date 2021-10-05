import i18next from 'i18next'
import './wekanInterfaceSettings.html'
import Projects from '../../api/projects/projects.js'

function validateWekanUrl() {
  const templateInstance = Template.instance()
  const wekanUrl = templateInstance.$('#wekanurl').val()
  if (!wekanUrl || wekanUrl === undefined) {
    templateInstance.$('#wekanurl').addClass('is-invalid')
    templateInstance.$('#wekan-status').html('<i class="fa fa-times"></i>')
    return
  }
  const authToken = wekanUrl?.match(/authToken=(.*)/) ? wekanUrl?.match(/authToken=(.*)/)[1] : false
  if (!authToken) {
    templateInstance.$('#wekanurl').addClass('is-invalid')
    templateInstance.$('#wekan-status').html('<i class="fa fa-times"></i>')
    return
  }
  const url = wekanUrl.substring(0, wekanUrl.indexOf('export?'))
  if (url.length < 1) {
    templateInstance.$('#wekanurl').addClass('is-invalid')
    templateInstance.$('#wekan-status').html('<i class="fa fa-times"></i>')
    return
  }
  templateInstance.$('#wekan-status').html('<i class="fa fa-spinner fa-spin"></i>')
  templateInstance.$('#wekanurl').prop('disabled', true)
  window.fetch(`${url}lists`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((result) => {
    templateInstance.$('#wekan-status').removeClass()
    templateInstance.$('#wekanurl').prop('disabled', false)
    if (!result || result.error) {
      templateInstance.$('#wekanurl').addClass('is-invalid')
      templateInstance.$('#wekan-status').html('<i class="fa fa-times"></i>')
    } else {
      templateInstance.wekanLists.set(result)
      templateInstance.$('#wekanurl').removeClass('is-invalid')
      templateInstance.$('#wekan-status').html('<i class="fa fa-check"></i>')
      const columns = [i18next.t('project.wekan_list')]
      const data = templateInstance.wekanLists.get().map((entry) => ([{
        content: entry.title,
        editable: false,
        focusable: false,
        resizeable: false,
        format: (value) => ((templateInstance
          .project?.get()?.selectedWekanList?.find((element) => element === entry._id))
          ? `<div class="form-check form-check-inline">
                    <input class="form-check-input js-wekan-list-entry" type="checkbox" value="${entry._id}" checked/>
                    <label class="form-check-label">${value}</label>
                    </div>`
          : `<div class="form-check form-check-inline">
                    <input class="form-check-input js-wekan-list-entry" type="checkbox" value="${entry._id}"/>
                    <label class="form-check-label">${value}</label>
                    </div>`),
      }]))
      if (!templateInstance.wekanListDatatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              noDataMessage: i18next.t('tabular.sZeroRecords'),
              events: {
                onRemoveColumn() {
                  templateInstance.wekanListDatatable.refresh(data, columns)
                },
              },
            }
            try {
              window.requestAnimationFrame(() => {
                templateInstance.wekanListDatatable = new DataTable('#wekan-list-container', datatableConfig)
                templateInstance.$('.dt-scrollable').height('+=4')
              })
            } catch (wekanListcreationerror) {
              console.error(`Caught error: ${wekanListcreationerror}`)
            }
          })
        })
      } else {
        try {
          templateInstance.wekanListDatatable.refresh(data, columns)
        } catch (wekanListdatarefresherror) {
          console.error(`Caught error: ${wekanListdatarefresherror}`)
        }
      }
    }
  }).catch((error) => {
    console.error(error)
    templateInstance.$('#wekanurl').addClass('is-invalid')
    templateInstance.$('#wekan-status').html('check')
  })
  window.fetch(`${url}swimlanes`, { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.json()).then((result) => {
    templateInstance.$('#wekan-status').removeClass()
    templateInstance.$('#wekanurl').prop('disabled', false)
    if (!result || result.error) {
      templateInstance.$('#wekanurl').addClass('is-invalid')
      templateInstance.$('#wekan-status').html('<i class="fa fa-times"></i>')
    } else if (result.length > 1) {
      templateInstance.wekanSwimlanes.set(result)
      templateInstance.$('#wekanurl').removeClass('is-invalid')
      templateInstance.$('#wekan-status').html('<i class="fa fa-check"></i>')
      const columns = [i18next.t('project.wekan_swimlane')]
      const data = templateInstance.wekanSwimlanes.get().map((entry) => ([{
        content: entry.title,
        editable: false,
        focusable: false,
        resizeable: false,
        format: (value) => ((templateInstance
          .project?.get()?.selectedWekanSwimlanes?.find((element) => element === entry._id))
          ? `<div class="form-check form-check-inline">
                    <input class="form-check-input js-wekan-swimlane-entry" type="checkbox" value="${entry._id}" checked/>
                    <label class="form-check-label">${value}</label>
                    </div>`
          : `<div class="form-check form-check-inline">
                    <input class="form-check-input js-wekan-swimlane-entry" type="checkbox" value="${entry._id}"/>
                    <label class="form-check-label">${value}</label>
                    </div>`),
      }]))
      if (!templateInstance.swimlaneDatatable) {
        import('frappe-datatable/dist/frappe-datatable.css').then(() => {
          import('frappe-datatable').then((datatable) => {
            const DataTable = datatable.default
            const datatableConfig = {
              columns,
              data,
              serialNoColumn: false,
              clusterize: false,
              layout: 'fluid',
              noDataMessage: i18next.t('tabular.sZeroRecords'),
              events: {
                onRemoveColumn() {
                  templateInstance.swimlaneDatatable.refresh(data, columns)
                },
              },
            }
            try {
              window.requestAnimationFrame(() => {
                templateInstance.swimlaneDatatable = new DataTable('#wekan-swimlane-container', datatableConfig)
                templateInstance.$('.dt-scrollable').height('+=4')
              })
            } catch (swimlanecreationerror) {
              console.error(`Caught error: ${swimlanecreationerror}`)
            }
          })
        })
      } else {
        try {
          templateInstance.swimlaneDatatable.refresh(data, columns)
        } catch (swimlanedatarefresherror) {
          console.error(`Caught error: ${swimlanedatarefresherror}`)
        }
      }
    }
  }).catch((error) => {
    console.error(error)
    templateInstance.$('#wekanurl').addClass('is-invalid')
    templateInstance.$('#wekan-status').html('check')
  })
}

Template.wekanInterfaceSettings.onCreated(function wekanInterfaceSettingsCreated() {
  this.wekanLists = new ReactiveVar()
  this.wekanSwimlanes = new ReactiveVar()
  this.project = new ReactiveVar()
  this.autorun(() => {
    if (this.data.projectId) {
      this.project.set(Projects.findOne({ _id: this.data.projectId }))
      this.handle = this.subscribe('singleProject', this.data.projectId)
    }
  })
})
Template.wekanInterfaceSettings.helpers({
  wekanurl: () => (Template.instance().project.get()
    ? Template.instance().project.get().wekanurl : false),
  wekanLists: () => Template.instance().wekanLists.get(),
  wekanSwimlanes: () => Template.instance().wekanSwimlanes.get(),
  displayHelp: () => Template.instance().wekanLists.get()
    || Template.instance().wekanSwimlanes.get(),
})
Template.wekanInterfaceSettings.events({
  'change #wekanurl': (event) => {
    event.preventDefault()
    validateWekanUrl()
  },
  'click #wekan-status': (event) => {
    event.preventDefault()
    validateWekanUrl()
  },
  'change .js-wekan-list-entry': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-wekan-swimlane-entry').prop('checked', false)
  },
  'change .js-wekan-swimlane-entry': (event, templateInstance) => {
    event.preventDefault()
    templateInstance.$('.js-wekan-list-entry').prop('checked', false)
  },
})
