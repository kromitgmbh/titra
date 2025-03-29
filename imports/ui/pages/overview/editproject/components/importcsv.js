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
      instance.error.set(t('errors.noFileSelected'))
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
        renderDataTable(instance, parsedData);
      } catch (err) {
        instance.error.set(err.message || t('errors.fileReadFailed'))
        instance.loading.set(false)
        instance.csvData.set(null)
      }
    };

    reader.onerror = () => {
      instance.error.set(t('errors.fileReadFailed'))
      instance.loading.set(false)
      instance.csvData.set(null)
    };
    reader.readAsText(file);
  },
  'click #import-data-button'(event, instance) {
    event.preventDefault()
    const csvData = instance.csvData.get()
    if (!csvData) {
      instance.error.set(t('errors.noFileSelected'))
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
        throw new Meteor.Error(t('errors.invalidHeader'));
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== 3) {
            throw new Meteor.Error(t('errors.invalidDataFormat') + ` ${i + 1}.`);
        }

        const task = values[0];
        const date = values[1];
        const hours = Number(values[2]);

        // Date validation: ISO 8601
        const utcDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        if (!utcDateRegex.test(date)) {
            throw new Meteor.Error(t('errors.invalidDateFormat') + ` ${i + 1}. Expected UTC format (YYYY-MM-DDTHH:mm:ss.sssZ).`);
        }

        if (isNaN(hours) || hours < 0) {
            throw new Meteor.Error(t('errors.invalidHours') + ` ${i + 1}.`);
        }

        data.push({ Task: task, Date: date, Hours: hours });
    }
    return data;
}

function renderDataTable(data) {
  const instance = Template.instance()
  const container = $('#data-table-container')[0];
  if (!container) {
    console.error('Data table container not found');
    return;
  }

  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="text-gray-400 text-center py-4">${t('general.noData')}</div>`;
    return;
  }

  const table = document.createElement('table');
  table.className = 'table table-striped table-bordered';

  const thead = document.createElement('thead');
  thead.className = 'thead-light';
  const headerRow = document.createElement('tr');
  const columns = [
    { key: 'Task', label: t('tableHeaders.task') },
    { key: 'Date', label: t('tableHeaders.date') },
    { key: 'Hours', label: t('tableHeaders.hours') },
  ];

  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(column => {
      const td = document.createElement('td');
      td.textContent = row[column.key];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
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