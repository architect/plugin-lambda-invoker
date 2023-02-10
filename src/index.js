let { join } = require('path')
let { existsSync, readFileSync } = require('fs')
let { updater } = require('@architect/utils')
let { prompt } = require('enquirer')
let colors = require('ansi-colors')
let update = updater('Invoker')
let mock = require('./event-mocks')

module.exports = {
  sandbox: {
    start: async ({ inventory: { inv }, invoke }) => {
      start()
      update.status(`Event invoker started, select an event to invoke by pressing 'i'`)
      let { cwd, preferences } = inv._project
      let jsonMocks = join(cwd, 'sandbox-invoke-mocks.json')
      let jsMocks = join(cwd, 'sandbox-invoke-mocks.js')
      let inputPromptOpen = false

      let pragmas = [ 'events', 'queues', 'scheduled', 'tables-streams' ]
      let prefs = preferences?.sandbox?.invoker
      if (prefs) {
        if (Array.isArray(prefs)) pragmas = prefs
        else if (typeof prefs === 'string') pragmas = [ prefs ]
        else throw Error('Invalid @architect/plugin-lambda-invoker plugin preferences')
      }

      // Build out the availble event list
      let events = {}
      pragmas.forEach(pragma => {
        if (inv[pragma]) inv[pragma].forEach(({ name }) => {
          events[`@${pragma} ${name}`] = { pragma, name }
        })
      })
      // Add a cancel option should one desire
      events.cancel = ''

      process.stdin.on('data', async function eventInvokeListener (input) {
        start()
        input = String(input)
        // Reset Enquirer's styles
        let options = {
          prefix: colors.white(colors.symbols.question),
          styles: {
            em: colors.cyan, // Clear underlines
            danger: colors.red,
            strong: colors.white,
          }
        }
        if (input === 'i' && !inputPromptOpen) {
          if (Object.keys(events).length === 1) {
            let none = 'No Lambdas found to invoke'
            if (pragmas.length) update.status(none, `Using the following pragmas: @${pragmas.join(', @')}`)
            else update.status(none)
            return
          }

          let userPayload = {}
          let mocks
          let mockName = 'empty'

          // Load invocation mocks
          if (existsSync(jsonMocks)) {
            mocks = JSON.parse(readFileSync(jsonMocks))
          }
          else if (existsSync(jsMocks)) {
            // Make sure changes to mocks are always reflected
            delete require.cache[require.resolve(jsMocks)]
            // eslint-disable-next-line
            mocks = require(jsMocks)
          }

          let { lambda } = await prompt({
            type: 'select',
            name: 'lambda',
            numbered: true,
            message: 'Which event do you want to invoke?',
            hint: '\nYou can use numbers to change your selection',
            choices: Object.keys(events),
          }, options)
          if (lambda === 'cancel') return start()
          let { pragma, name } = events[lambda]

          // Present options for mocks (if any)
          let mockable = ![ 'scheduled', 'tables-streams' ].includes(pragma)
          if (mocks?.[pragma]?.[name] && mockable) {
            let selection = await prompt({
              type: 'select',
              name: 'mock',
              numbered: true,
              message: 'Which mock do you want to invoke?',
              choices: [ ...Object.keys(mocks[pragma][name]), 'empty' ],
            }, options)
            mockName = selection.mock
            userPayload = mocks[pragma][name][mockName] || {}

            if (typeof userPayload === 'function') {
              inputPromptOpen = true
              let { mockinput } = await prompt(
                {
                  type: 'input',
                  name: 'mockinput',
                  message: 'What input to use for mock function?',
                },
                options
              )
              inputPromptOpen = false
              let mockInputArgs = mockinput.split(',')
              userPayload = userPayload(...mockInputArgs)
            }
          }

          let payload
          /**/ if (pragma === 'events') payload = mock.events(userPayload)
          else if (pragma === 'queues') payload = mock.queues(userPayload)
          else if (pragma === 'scheduled') payload = mock.scheduled()
          else if (pragma === 'tables-streams') {
            let { eventName } = await prompt({
              type: 'select',
              name: 'eventName',
              message: 'Which kind of Dynamo Stream event do you want to invoke?',
              choices: [ 'INSERT', 'MODIFY', 'REMOVE' ]
            })
            payload = mock.tablesStreams(eventName)
          }
          else {
            if (!Object.keys(userPayload).length) {
              update.warning('Warning: real AWS event sources generally do not emit empty payloads')
            }
            payload = userPayload
          }

          // Wrap it up and invoke!
          let msg = `Invoking @${pragma} ${name}`
          msg += ` with ${mockName === 'empty' ? 'empty' : `'${mockName}'`} payload`
          update.status(msg)
          await invoke({ pragma, name, payload })
          start()
        }
      })
    },
    end: async () => {
      // Only remove our listener; removing Enquirer causes funky behavior
      process.stdin.rawListeners('data').forEach(fn => {
        if (fn.name === 'eventInvokeListener') {
          process.stdin.removeListener('data', fn)
        }
      })
      end()
    }
  }
}

// Necessary per Enquirer #326
function start () {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
  }
}

// Super important to pause stdin, or Sandbox will hang forever in tests
function end () {
  if (process.stdin.isTTY) {
    process.stdin.pause()
  }
}
