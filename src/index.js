let { updater } = require('@architect/utils')
let update = updater('Invoker')
let bindInputHandler = require('./input-handler')
let { start, end, defaultPragmas } = require('./utils')
let deactivatedInvoke = async () => console.log('Sandbox not yet started!')

let sandbox = {
  start: async ({ inventory: { inv }, invoke }) => {
    start()
    let pragmas = defaultPragmas.slice(0)
    update.status(`Event invoker started, select an event to invoke by pressing 'i'`)
    plugin.invoke = invoke
    let { preferences } = inv._project
    let prefs = preferences?.sandbox?.invoker
    if (prefs) {
      if (Array.isArray(prefs)) pragmas = prefs
      else if (typeof prefs === 'string') pragmas = [ prefs ]
      else throw Error('Invalid @architect/plugin-lambda-invoker plugin preferences')
    }
    process.stdin.on('data', bindInputHandler(update, pragmas, inv, invoke))
  },
  end: async () => {
    // Only remove our listener; removing Enquirer causes funky behavior
    process.stdin.rawListeners('data').forEach(fn => {
      if (fn.name === 'eventInvokeListener') {
        process.stdin.removeListener('data', fn)
      }
    })
    plugin.invoke = deactivatedInvoke
    end()
  },
}

let plugin = {
  sandbox,
  invoke: deactivatedInvoke,
}
module.exports = plugin

