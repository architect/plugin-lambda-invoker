[<img src="https://assets.arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/plugin-lambda-invoker)

## [`@architect/plugin-lambda-invoker`](https://www.npmjs.com/package/@architect/plugin-lambda-invoker)

> Interactively invoke Lambdas in Architect Sandbox with arbitrary events

[![GitHub CI status](https://github.com/architect/plugin-lambda-invoker/workflows/Node%20CI/badge.svg)](https://github.com/architect/plugin-lambda-invoker/actions?query=workflow%3A%22Node+CI%22)


## Install

Into your existing Architect project:

```sh
npm i @architect/plugin-lambda-invoker --save-dev
```

Add the following to your Architect project manifest (usually `app.arc`):

```arc
@plugins
architect/plugin-lambda-invoker
```


## Usage

### CLI

While Sandbox is running, type `i` in your terminal to bring up the Lambda invocation menu. Then select the Lambda you'd like to invoke.

By default, this plugin will populate your menu with all `@events`, `@queues`, `@scheduled`, and `@tables-streams`; you can limit this menu (or expand it with additional pragmas) by adding the following setting to a `pref[erence]s.arc` file:

```arc
@sandbox
invoker http scheduled # This would populate @http + @scheduled Lambdas, and ignore all others
```

> Tip: you can navigate the invocation menu by typing numbers (zero-indexed)!


### Programmatic

The plugin also passes through the [Sandbox invoker](https://arc.codes/docs/en/guides/plugins/sandbox#invoke-function) for programmatic use (such as in a test environment). This method is only available after Sandbox has finished initializing.

```js
let sandbox = require('@architect/sandbox')
let invokerPlugin = require('@architect/plugin-lambda-invoker')

await sandbox.start()
await invokerPlugin.invoke({
  pragma: 'scheduled',
  name: 'my-scheduled-event',
  payload: { ok: true },
})
await sandbox.end()
```


### Invocation mocks

By default, Lambdas are invoked with an empty payload (`{}`); if you'd like to invoke your Lambdas with arbitrary payloads, create a file containing invocation mocks.

Invocation mock files live in your root with one of these filenames: `sandbox-invoke-mocks.json` or `sandbox-invoke-mocks.js`. These files should be structured like so:

Assuming this project manifest:

```arc
@events
background-task

@queues
analytics

@scheduled
backup-database
```

If you wanted to add one or more mocks to each of the three Lambdas above, create the following `sandbox-invoke-mocks.js` (or equivalent JSON) file with the format of `[pragmaName][lambdaName][mockName]`:

```js
module.exports = {
  events: {
    'background-task': {
      'my-first-mock': { /* payload */ },
      'another-mock': { /* payload */ },
    }
  },
  queues: {
    analytics: {
      'one-more-mock': { /* payload */ },
      'just-a-mock': { /* payload */ },
    }
  },
  scheduled: {
    'backup-database': {
      'a-mock-for-this': { /* payload */ },
      'the-last-mock': { /* payload */ },
    }
  },
}
```

> Tip: when using `sandbox-invoke-mocks.js`, you can dynamically (synchronously) generate mocks on startup
