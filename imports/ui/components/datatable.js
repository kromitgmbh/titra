import './datatable.html'
import i18next from 'i18next'

Template.datatable.onRendered(() => {
  const templateInstance = Template.instance()
  templateInstance.autorun(() => {
    const columns = templateInstance.data.columns?.get()
    const data = templateInstance.data.data?.get()
    if (columns && data) {
      if (!templateInstance.datatableInstance) {
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
            }
            try {
              window.requestAnimationFrame(() => {
                templateInstance.datatableInstance = new DataTable(templateInstance.$('.js-datatable-container').get(0), datatableConfig)
                templateInstance.$('.dt-scrollable').height('+=4')
              })
            } catch (datatableCreationError) {
              console.error(`Caught error: ${datatableCreationError}`)
            }
          })
        })
      } else {
        try {
          templateInstance.datatableInstance.refresh(data, columns)
        } catch (datatableRefreshError) {
          console.error(`Caught error: ${datatableRefreshError}`)
        }
      }
    }
  })
})
