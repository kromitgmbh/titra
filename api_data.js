define({ "api": [
  {
    "type": "post",
    "url": "/project/create/",
    "title": "Create a new project",
    "description": "<p>Creates a new titra project based on the parameters provided</p>",
    "name": "CreateProject",
    "group": "Project",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>The project name.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "description",
            "description": "<p>The description of the project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "color",
            "description": "<p>The project color in HEX color code.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "customer",
            "description": "<p>The customer of the project.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "rate",
            "description": "<p>The hourly rate of the project.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "budget",
            "description": "<p>The budget for this project in hours.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"name\": \"Project A\",\n  \"description\": \"This is the description of Project A.\",\n  \"color\": \"#009688\",\n  \"customer\": \"Paying customer\",\n  \"rate\": 100,\n  \"budget\": 50\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>The id of the new project.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "{\n message: \"time entry created.\"\n payload: {\n   projectId: \"123456\"\n }\n }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "Project",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/project/create/"
      }
    ],
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/project/list/",
    "title": "Get all projects",
    "description": "<p>Lists all projects visible to the user assigned to the provided API token</p>",
    "name": "getProjects",
    "group": "Project",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>An array of all projects visible for the user with the provided API token.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "Project",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/project/list/"
      }
    ],
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/timeentry/create",
    "title": "Create time entry",
    "name": "createTimeEntry",
    "description": "<p>Create a new time entry for the user assigned to the provided API token</p>",
    "group": "TimeEntry",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "projectId",
            "description": "<p>The project ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "task",
            "description": "<p>The task description of the new time entry.</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "optional": false,
            "field": "date",
            "description": "<p>The date for the new time entry in format YYYY-MM-DD.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "hours",
            "description": "<p>The number of hours to track.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"projectId\": \"123456\",\n  \"task\": \"Work done.\",\n  \"date\": \"2019-11-10\",\n  \"hours\": 8\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "The",
            "description": "<p>id of the new time entry.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "{\n message: \"time entry created.\"\n payload: {\n   timecardId: \"123456\"\n }\n }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "TimeEntry",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/timeentry/create"
      }
    ],
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/timeentry/list/:date",
    "title": "Get time entries for date",
    "description": "<p>Create a new time entry for the user assigned to the provided API token</p>",
    "name": "getTimeEntriesForDate",
    "group": "TimeEntry",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Date",
            "optional": false,
            "field": "date",
            "description": "<p>The date to list time entries for in format YYYY-MM-DD.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>An array of time entries tracked for the user with the provided API token for the provided date.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "TimeEntry",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/timeentry/list/:date"
      }
    ],
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/timer/get/",
    "title": "Get the duration of the current timer",
    "description": "<p>Get the duration in milliseconds and the start timestamp of the currently running timer for the API user.</p>",
    "name": "getTimer",
    "group": "TimeEntry",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>Returns the duration of the currently running timer.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "{\n message: \"Running timer received.\"\n payload: {\n   \"duration\": 60000,\n   \"startTime\": \"Sat Jun 26 2021 21:48:11 GMT+0200\"\n }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>There is no running timer.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"No running timer found.\"\n}",
          "type": "json"
        },
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "TimeEntry",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/timer/get/"
      }
    ]
  },
  {
    "type": "post",
    "url": "/timer/start/",
    "title": "Start a new timer",
    "description": "<p>Starts a new timer for the API user if there is no current running timer.</p>",
    "name": "startTimer",
    "group": "TimeEntry",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>If there is no current running timer a new one will be started.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "{\n message: \"New timer started.\"\n payload: {\n   \"startTime\": \"Sat Jun 26 2021 21:48:11 GMT+0200\"\n }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>There is already another running timer.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"There is already another running timer.\"\n}",
          "type": "json"
        },
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "TimeEntry",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/timer/start/"
      }
    ]
  },
  {
    "type": "post",
    "url": "/timer/stop/",
    "title": "Stop a running timer",
    "description": "<p>Stop a running timer of the API user and return the start timestamp and duration in milliseconds.</p>",
    "name": "stopTimer",
    "group": "TimeEntry",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>The authorization header Bearer API token.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>Returns the duration in milliseconds and the start timestamp of the stopped timer as result.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "{\n message: \"Running timer stopped.\"\n payload: {\n   \"duration\": 60000,\n   \"startTime\": \"Sat Jun 26 2021 21:48:11 GMT+0200\"\n }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "response",
            "description": "<p>No running timer to stop.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "json",
            "optional": false,
            "field": "AuthError",
            "description": "<p>The request is missing the authentication header or an invalid API token has been provided.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"No running timer found.\"\n}",
          "type": "json"
        },
        {
          "title": "Authorization-Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"message\": \"Missing authorization header or invalid authorization token supplied.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "server/APIroutes.js",
    "groupTitle": "TimeEntry",
    "sampleRequest": [
      {
        "url": "https://app.titra.io/timer/stop/"
      }
    ]
  }
] });
