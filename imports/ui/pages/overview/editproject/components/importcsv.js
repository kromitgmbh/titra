import { Meteor } from 'meteor/meteor'
import { $ } from 'meteor/jquery'
import { t } from '../../../../../utils/i18n'
import './importcsv.html'

Template.importProjectCSV.onCreated(function importProjectCSVOnCreated() {
    this.file = new ReactiveVar(null);
    this.csvData = new ReactiveVar(null);
    this.error = new ReactiveVar(null);
    this.isUploaded = new ReactiveVar(false);
    this.loading = new ReactiveVar(false);
})
Template.importProjectCSV.onRendered(function importProjectCSVOnRendered() {
  
})
Template.importProjectCSV.events({
  'change #file-input'(event, instance) {
    const selectedFile = event.target.files?.[0]
    instance.file.set(selectedFile)
    instance.error.set(null)
  },
  'click #remove-file-button'(event, instance) {
    event.preventDefault()
    instance.file.set(null)
  },
  'click #parse-csv-button'(event, instance) {
    event.preventDefault()
    const file = instance.file.get();
    if (!file) {
      instance.error.set(t('project.importCSV.noFileSelected'))
      return;
    }

    instance.loading.set(true)
    instance.error.set(null)
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result
        const parsedData = parseCSV(text)
        instance.csvData.set(parsedData)
        instance.loading.set(false)
        Meteor.setTimeout(() => { renderDataTable(instance, parsedData) }, 500);
      } catch (err) {
        instance.error.set(err.message || t('project.importCSV.fileReadFailed'))
        instance.loading.set(false)
        instance.csvData.set(null)
      }
    };

    reader.onerror = () => {
      instance.error.set(t('project.importCSV.fileReadFailed'))
      instance.loading.set(false)
      instance.csvData.set(null)
    };
    reader.readAsText(file);
  },
  'click #import-data-button'(event, instance) {
    event.preventDefault()
    const csvData = instance.csvData.get()
    if (!csvData) {
      instance.error.set(t('project.importCSV.noFileSelected'))
      return
    }

    instance.loading.set(true)
    instance.error.set(null)
    /*Meteor.call('importProjectCSVData', csvData, (error, result) => {
      if (error) {
        instance.error.set(error.message || t('errors.importFailed'))
        instance.loading.set(false)
      } else {
        instance.isUploaded.set(true)
        instance.csvData.set(null)
        instance.file.set(null)
        instance.loading.set(false)
        console.log(result.message)
      }
    });*/
  },
});

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Basic header validation
    if (headers.length !== 3 || headers[0] !== 'Task' || headers[1] !== 'Date' || headers[2] !== 'Hours') {
        throw new Meteor.Error(t('project.importCSV.invalidHeader'));
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== 3) {
            throw new Meteor.Error(t('project.importCSV.invalidDataFormat') + ` ${i + 1}.`);
        }

        const task = values[0];
        const date = values[1];
        const hours = Number(values[2]);

        // Date validation:  Allow YYYY-MM-DD or ISO 8601 UTC
        const utcDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!utcDateRegex.test(date) && !simpleDateRegex.test(date)) {
            throw new Meteor.Error(t('project.importCSV.invalidDateFormat') + ` ${i + 1}. Expected UTC format (YYYY-MM-DDTHH:mm:ss.sssZ) or YYYY-MM-DD.`);
        }

        if (isNaN(hours) || hours < 0) {
            throw new Meteor.Error(t('project.importCSV.invalidHours') + ` ${i + 1}.`);
        }

        data.push({ Task: task, Date: date, Hours: hours });
    }
    return data;
}

function renderDataTable(instance, data) {
  const container = $('#data-table-container')[0];
  if (!container) {
    console.error('Data table container not found');
    return;
  }
  container.innerHTML = '';
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="text-gray-400 text-center py-4">${t('project.importCSV.noData')}</div>`;
    return;
  }
  console.log(data)
  // Transform data into an array of arrays
  const transformedData = data.map(row => [row.Task, row.Date, row.Hours]);

  const columns = [
    { id: 'Task', name: t('globals.task') },
    { id: 'Date', name: t('globals.date') },
    { id: 'Hours', name: t('globals.hour_plural') },
  ];
  import('frappe-datatable/dist/frappe-datatable.css').then(() => {
    import('frappe-datatable').then((datatable) => {
      const DataTable = datatable.default
        new DataTable('#data-table-container', {
          columns,
          data: transformedData,
          layout: 'fluid', // Makes the table responsive
          pagination: true, // Enables pagination
          inlineFilters: true, // Enables inline filters
          resizable: true, // Allows resizing of columns
        })
    })
  })
}

Template.importProjectCSV.helpers({
  file() {
    return Template.instance().file.get();
  },
  csvData() {
    return Template.instance().csvData.get();
  },
  error() {
    return Template.instance().error.get();
  },
  isUploaded() {
    return Template.instance().isUploaded.get();
  },
  loading() {
    return Template.instance().loading.get();
  },
  jsonCsvData() {
    const data = Template.instance().csvData.get();
    return data ? JSON.stringify(data, null, 2) : '';
  }
});