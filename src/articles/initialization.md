---
title: Initialization
date: 2018-02-24
blurb: A useful convention and pattern for initialization-time side-efffects, such as listening to browser events or subscribing to websockets.
keywords: initialization, init, startup, convention
---

It is common for an app to need to do "things" at start-up. Things, such as subscribing to websocket-connections, listening to browser-events, make an async fetch-request.

The callbacks of these operations need to call actions of your app in order to interact with it. Thankfully, `app(...)` returns your wired actions, so you can hook them up to your callbacks.

```js
const wiredActions = app(...)

fetch('http://example.com/first_data')
.then(data => data.json())
.then(data => wiredActions.loaded(data))
``` 

This works for main-level initialization. But if you've broken up your state/actions in several namespaces, imported from different files (such as I talk about in [modularizing apps](https://zaceno.github.com/post/modular-apps/)) - then how do you give each of your modules their own wired actions?

Hyperapp's [router](https://github.com/hyperapp/router) has the following approach to this:

```js
import { h, app } from "hyperapp"
import { location as router} from "@hyperapp/router"
const state = {
    router: router.state,
    ...
}

const actions = {
    router: router.actions,
    ...
}

const view = ...

const wiredActions = app(state, actions, view, document.body)

router.subscribe(wiredActions.router)

```

Notice how the `router` has a `subscribe` function, to which you pass the router-namespace's actions. This allows the router module to subscribe them to route-change events.

This works fine for the router, but it doesn't quite scale if you have multiple modules. Especially if they're nested several levels deep.

In my apps, I have often adopted the *convention* of an `init` action. As an action, it has access to all the other actions, so I can set them up as callbacks just the same. All that needs to be done after the `app(...)` call is to call the `init()` action.

```js

const {init} = app(
    //STATE
    {
        router: router.state,
        ...
    },

    ///ACTIONS
    {
        router: router.actions,

        init: _ => (_, actions) => {
            router.subscribe(actions.router)

            fetch('https://example.com/first_data')
            .then(data => data.json())
            .then(actions.loadData)            
        },
        ...
    },

    //VIEW
    ...,

    //CONTAINER
    document.body
)

init()

```

At this point, it doesn't look much better than if we'd just done all the initialization after `app(...)`. But imagine if we had several modules, and each wanted to define their own initialization steps, and bind to their actions (after they'd been wired). Rather than following the example of the router, we could simply initialize the submodules from our top-level init:

```js
import foo from './foo'
import bar from './bar'

const {init} = app(
    //STATE
    {
        foo: foo.state,
        bar: bar.state,
        ...
    },

    //ACTIONS
    {
        foo: foo.actions,
        bar: bar.actions,
        init: _ => (_, actions) => {
            actions.foo.init()
            actions.bar.init()
            //top level initializations
        },
        ...
    },

    //VIEW
    ...,

    //CONTAINER
    document.body
)

init()
```

As long as we stick to the convention of every module having an `init` action which calls the `init()` of submodules - then all submodules' initialization will be called at startup. And there's no need to know *how* to call them (such as `router.subscribe`), or what actions they need. 

One thing you perhaps are wondering: when, in the lifecycle of an app, is `init()` called? 

By the time `app(...)` returns, it will have wired all the actions (or else how could it return them), but the app will *not yet* have rendered for the first time. If you want to hold something off until after the first render, wrap it in a `setTimeout(..., 0)`