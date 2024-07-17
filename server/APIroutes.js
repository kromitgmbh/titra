import { Match, check } from 'meteor/check'
import { WebApp } from 'meteor/webapp';
import { getJson } from './bodyparser'
import { insertTimeCard } from '../imports/api/timecards/server/methods'
import Timecards from '../imports/api/timecards/timecards'
import Projects from '../imports/api/projects/projects'

function sendResponse(res, statusCode, message, payload) {
  const response = {}
  response.statusCode = statusCode
  response.message = message
  if (payload) {
    response.payload = payload
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  })
  res.end(JSON.stringify(response))
}
async function checkAuthorization(req, res) {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const meteorUser = await Meteor.users.findOneAsync({ 'profile.APItoken': authHeader.split(' ')[1] })
    if (authHeader && authHeader.split(' ')[1] && meteorUser) {
      return meteorUser
    }
  }
  sendResponse(res, 401, 'Missing authorization header or invalid authorization token supplied.')
  return false
}
/**
 * @apiDefine AuthError
 * @apiError {json} AuthError The request is missing the authentication header or an invalid API token has been provided.
 * @apiErrorExample {json} Authorization-Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "message": "Missing authorization header or invalid authorization token supplied."
 *     }
 */

/**
 * @api {post} /timeentry/create Create time entry
 * @apiName createTimeEntry
 * @apiDescription Create a new time entry for the user assigned to the provided API token
 * @apiGroup TimeEntry
 *
 * @apiHeader {String} Token The authorization header Bearer API token.
 * @apiBody {String} projectId The project ID.
 * @apiBody {String} task The task description of the new time entry.
 * @apiBody {Date} date The date for the new time entry in format YYYY-MM-DD.
 * @apiBody {Number} hours The number of hours to track.
 * @apiBody {Number} [taskRate] The rate for the task.
 * @apiBody {Object} [customfields] An object containing custom fields for the time entry.
 * @apiParamExample {json} Request-Example:
 *                  {
 *                    "projectId": "123456",
 *                    "task": "Work done.",
 *                    "date": "2019-11-10",
 *                    "hours": 8
 *                  }
 * @apiSuccess {json} response The id of the new time entry.
 * @apiSuccessExample {json} Success response:
 * {
 *  message: "time entry created."
 *  payload: {
 *    timecardId: "123456"
 *  }
 *  }
 * @apiUse AuthError
 */
WebApp.connectHandlers.use('/timeentry/create/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  let json
  try {
    json = await getJson(req)
  } catch (e) {
    sendResponse(res, 400, `Invalid JSON received. ${e}`)
  }
  if (json) {
    try {
      check(json.projectId, String)
      check(json.task, String)
      check(new Date(json.date), Date)
      check(json.hours, Number)
      check(json.taskRate, Match.Maybe(Number))
      check(json.customfields, Match.Maybe(Object))
    } catch (error) {
      sendResponse(res, 500, `Invalid parameters received.${error}`)
      return
    }
    const timecardId = await insertTimeCard(json.projectId, json.task, new Date(json.date), json.hours, meteorUser._id, json.taskRate, json.customfields)
    const payload = {}
    payload.timecardId = timecardId
    sendResponse(res, 200, 'Time entry created.', payload)
    return
  }
  sendResponse(res, 500, 'Missing mandatory parameters.')
})

/**
  * @api {get} /timeentry/list/:date Get time entries for date
  * @apiDescription Create a new time entry for the user assigned to the provided API token
  * @apiName getTimeEntriesForDate
  * @apiGroup TimeEntry
  *
  * @apiHeader {String} Token The authorization header Bearer API token.
  * @apiParam {Date} date The date to list time entries for in format YYYY-MM-DD.

  * @apiSuccess {json} response An array of time entries tracked for the user with the provided API token
  * for the provided date.
  * @apiUse AuthError
  */
WebApp.connectHandlers.use('/timeentry/list/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const url = req._parsedUrl.pathname.split('/')
  const date = new Date(url[3])
  try {
    check(date, Date)
  } catch (error) {
    sendResponse(res, 500, `Invalid parameters received.${error}`)
    return
  }
  const payload = Timecards.find({
    userId: meteorUser._id,
    date,
  }).fetch()
  sendResponse(res, 200, `Returning user time entries for date ${date}`, payload)
})

/**
   * @api {get} /project/list/ Get all projects
   * @apiDescription Lists all projects visible to the user assigned to the provided API token
   * @apiName getProjects
   * @apiGroup Project
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiSuccess {json} response An array of all projects visible for the user with the provided API token.
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/project/list/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const payload = await Projects.find({
    $or: [{ userId: meteorUser._id }, { public: true }, { team: meteorUser._id }],
  }).fetchAsync()
  sendResponse(res, 200, 'Returning projects', payload)
})

/**
   * @api {post} /project/create/ Create a new project
   * @apiDescription Creates a new titra project based on the parameters provided
   * @apiName CreateProject
   * @apiGroup Project
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiBody {String} name The project name.
   * @apiBody {String} [description] The description of the project.
   * @apiBody {String} [color] The project color in HEX color code.
   * @apiBody {String} [customer] The customer of the project.
   * @apiBody {Number} [rate] The hourly rate of the project.
   * @apiBody {Number} [budget] The budget for this project in hours.

   * @apiParamExample {json} Request-Example:
   *                  {
   *                    "name": "Project A",
   *                    "description": "This is the description of Project A.",
   *                    "color": "#009688",
   *                    "customer": "Paying customer",
   *                    "rate": 100,
   *                    "budget": 50
   *                  }
   * @apiSuccess {json} response The id of the new project.
   *  * @apiSuccessExample {json} Success response:
    * {
    *    message: "time entry created.",
    *    payload: {
    *      projectId: "123456"
    *    }
    *  }
   * @apiUse AuthError
   * @apiExample {curl} Example usage:
 *     curl -d '{"name":"api-test-project", "description":"fabians api project"}' -H "Content-Type: application/json" -H "Authorization: Token abcdefgHIJKLMNOP" -X POST http://localhost:3000/project/create
   */
WebApp.connectHandlers.use('/project/create/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  let json
  try {
    json = await getJson(req)
  } catch (e) {
    sendResponse(res, 400, `Invalid JSON received. ${e}`)
  }
  if (json) {
    try {
      check(json.name, String)
      check(json.description, Match.Maybe(String))
      check(json.color, Match.Maybe(String))
      check(json.customer, Match.Maybe(String))
      check(json.rate, Match.Maybe(Number))
      check(json.budget, Match.Maybe(Number))
    } catch (error) {
      sendResponse(res, 500, `Invalid parameters received.${error}`)
      return
    }
    json.userId = meteorUser._id
    const projectId = await Projects.insertAsync(json)
    const payload = {}
    payload.projectId = projectId
    sendResponse(res, 200, 'Project created.', payload)
  }
})
/**
   * @api {post} /timer/start/ Start a new timer
   * @apiDescription Starts a new timer for the API user if there is no current running timer.
   * @apiName startTimer
   * @apiGroup TimeEntry
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiSuccess {json} response If there is no current running timer a new one will be started.
   *  * @apiSuccessExample {json} Success response:
    * {
    *  message: "New timer started."
    *  payload: {
    *    "startTime": "Sat Jun 26 2021 21:48:11 GMT+0200"
    *  }
    * }
   * @apiError {json} response There is already another running timer.
    *      @apiErrorExample {json} Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "message": "There is already another running timer."
    *     }
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/timer/start/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const payload = {}
  if (!meteorUser.profile.timer) {
    payload.startTime = meteorUser.profile.timer
    await Meteor.users.updateAsync({ _id: meteorUser._id }, { $set: { 'profile.timer': new Date() } })
    sendResponse(res, 200, 'New timer started.', payload)
  } else {
    sendResponse(res, 500, 'There is already another running timer.')
  }
})

/**
   * @api {get} /timer/get/ Get the duration of the current timer
   * @apiDescription Get the duration in milliseconds and the start timestamp of the currently running timer for the API user.
   * @apiName getTimer
   * @apiGroup TimeEntry
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiSuccess {json} response Returns the duration of the currently running timer.
   *  * @apiSuccessExample {json} Success response:
    * {
    *  message: "Running timer received."
    *  payload: {
    *    "duration": 60000,
    *    "startTime": "Sat Jun 26 2021 21:48:11 GMT+0200"
    *  }
    * }
   * @apiError {json} response There is no running timer.
    *      @apiErrorExample {json} Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "message": "No running timer found."
    *     }
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/timer/get/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const payload = {}
  if (meteorUser.profile.timer) {
    payload.startTime = meteorUser.profile.timer
    const currentTime = new Date()
    const timerTime = new Date(meteorUser.profile.timer)
    payload.duration = currentTime.getTime() - timerTime.getTime()
    sendResponse(res, 200, 'Running timer received.', payload)
  } else {
    sendResponse(res, 500, 'No running timer found.')
  }
})
/**
   * @api {post} /timer/stop/ Stop a running timer
   * @apiDescription Stop a running timer of the API user and return the start timestamp and duration in milliseconds.
   * @apiName stopTimer
   * @apiGroup TimeEntry
   *
   * @apiHeader {String} Token The authorization header Bearer API token.
   * @apiSuccess {json} response Returns the duration in milliseconds and the start timestamp of the stopped timer as result.
   *  * @apiSuccessExample {json} Success response:
    * {
    *  message: "Running timer stopped."
    *  payload: {
    *    "duration": 60000,
    *    "startTime": "Sat Jun 26 2021 21:48:11 GMT+0200"
    *  }
    * }
  * @apiError {json} response No running timer to stop.
    *      @apiErrorExample {json} Error-Response:
    *     HTTP/1.1 500 Internal Server Error
    *     {
    *       "message": "No running timer found."
    *     }
   * @apiUse AuthError
   */
WebApp.connectHandlers.use('/timer/stop/', async (req, res, next) => {
  const meteorUser = await checkAuthorization(req, res)
  if (!meteorUser) {
    return
  }
  const payload = {}
  if (meteorUser.profile.timer) {
    payload.startTime = meteorUser.profile.timer
    const currentTime = new Date()
    const timerTime = new Date(meteorUser.profile.timer)
    payload.duration = currentTime.getTime() - timerTime.getTime()
    await Meteor.users.updateAsync({ _id: meteorUser._id }, { $unset: { 'profile.timer': '' } })
    sendResponse(res, 200, 'Running timer stopped.', payload)
  } else {
    sendResponse(res, 500, 'No running timer found.')
  }
})
