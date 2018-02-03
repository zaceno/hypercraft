---
title: Modular Apps,
date: 2018-02-02
blurb: The key to building maintainable, large-scale apps is to break them down into small self-contained & reusable modules. But how?

keywords: modules, modularization, loose coupling, slices, scope, actions, view, views
---

As your app grows larger with more features & behaviors, keeping it all inside a single file eventually becomes untenable. The solution is to *modularize* -- i.e. to break your app into *modules*. A module is a file which exports some "part" of your app. The main file *imports* these parts and assembles them into the full app definition. Modules may in turn be assembled from sub-modules if necessary, and so on.

In order to assemble the modules into an app definition *in some general way*, the modules must adhere to some conventions / patterns. For the modularization to work -- to actually be beneficial -- some strategy for what to break apart and what to keep together is necessary.

This article outlines *one* such method. It's a method that's worked well for me, but there are certainly other possibilities. Regardless of your preference, the techniques might be of interest for devising your own system.

Let's start by examining the problem we're trying to solve:

## The Problem

### Hunt-n-peck
First, consider the mental effort of maintaining an already large single-file-app.

Your app's behavior is made up of various featurs/behaviors in some combination. When you go to change a particular behavior, it is spread out in various parts of the state, actions and view respectively. You'll need to move around a lot in the file, looking for where to make changes while mentally filtering out the code that isn't relevant.

### So. much. foo...
As second problem is the problem of an overcrowded namespace. There may be several features that require a state-property called `selected`, and an action called `select`. 

Once your features start multiplying, you need to start adding disambiguating prefixes/suffixes to your states & actions such as `selectedFoo` and `selectFoo: x => ({selectedFoo: x})`. And a dropdown container for selecting a foo might look like this:

```jsx
<select onchange={ev => actions.selectFoo(ev.currentTarget.value)}>
{state.fooOptions.map(opt => (
    <option selected={opt===state.selectedFoo}>{opt}</option>
))}
</select>
```

So much foo! The problem of all state and action sharing a namespace leads to verbose code with lots of repetitive typing, and further mental strain when scanning for the place to make your changes.

### All together now...
A third problem is distributing the development work across a team. If everyone needs to be working in the same files the whole time, they are bound to get in eachother's way.

## General strategies

### Slice it vertically

By breaking your app apart in modules that each encapsulate *a single feature* (or behavior), you ensure that when you go to fix that feature, everything you need is  in one place -- *and nothing you don't*. No more scouting around thousands of lines of code for the one spot to make your fix.

Encapsulating a feature means a module needs to hold the parts of the *state, actions and view* relevant to it.

### Loose Coupling

By slicing "vertically" (i.e. by features/behaviors) the modules tend to become *loosely coupled* -- meaning they don't need to interact very much with eachother. This should always be the goal. 

Those interactions that *are* necessary, are typically handled by having a parent module coordinating the interactions among child modules. Generally speaking: the looser the coupling, the *flatter the module tree* -- which makes debugging/developing the interactions between modules easier.

### Namespacing

Each module should be free to name it's state and actions and other things whatever it wants (and however short!), without fear of the name colliding with something outside itself.

State, actions and other stuff (...I'll get to that) in *child* modules should be accessible via namespaces defined in the parent module.

Enough theory! How do we achieve this?

## Slices to the rescue!

Hyperapp has a little-advertised feature, often referred to as "slices" (TBH I've never really liked that name), which works like this:

- Actions can be defined under a multi-leveled namespace.
- Actions in a namespace:
    - are only provided the state from the *corresponding namespace* in the state tree,
    - and only the actions under the same namespace in the action tree.
    - their returned partial state updates the state tree under the *corresponding namespace*

```js

const state = {
    foo: {
        value: 3
    },
    baz: 4
}

const actions = {
    foo: {
        increment: by => (state, actions) => {
            /*
                Here, state will be the object
                at state.foo,
                i.e: {value: 3}

                Also, actions will be the actions
                at actions.foo, i.e:
                {
                    increment: ..,,
                    decrement: ...,
                }
            
                Returning {value: something} from
                this action updates the state immutably
                so that state.foo.value === something
            */
            return { value: state.value + by } 
        },
        decremant: by => (state, actions) => {
            return { value: state.value - by }
        }
    },
    setBaz: x => ({baz: x})
}

```

In other words: this feature is exactly what we need for the module-namespacing issue. We could define a counter module in a file `counter.js` such as:

```js
export default initial => ({
    state: {
        value: initial
    },
    actions: {
        increment: by => state => ({value: state.value + by})
        decrement: by => state => ({value: state.value - by})
    }
})
```

... and then instantiate and mount the module in a parent module or the main app, like so:

```js
import counter from './counter'

const foo = counter(3)

const state = {
    foo: foo.state,
    baz: 4,
}

const actions = {
    foo: foo.actions,
    setBaz: x => ({baz: x})
}
...
```

## Modularizing the view.

"Slices" allows us to create modules that encapsulate related state and actions. But what about the related parts of the view?

Imagine you have this `baroptions.js` module:

```js
export default _ => ({
    state: {
        selected: null,
        options: [],
    },
    actions: {
        addOption: opt => ({options}) => ({options: options.concat(opt)})
        select: opt => ({selected: opt})
    }
})
```

and in the view you have some parts that are related to your baroptions module:

```jsx
const view = (state, actions) => <main>
    ...
    <h1>Bar: {state.bar.selected}</h1>
    ...
    <select onchange={ev => actions.bar.select(ev.currentTarget.value)}>
    {state.bar.options.map(opt => (
        <option selected={actions.bar.selected===opt}>{opt}</option>
    ))}
    </select>
    ...
    <input
        type="text"
        onchange={ev => actions.bar.addOption(ev.currentTarget.value)}
    />
</main>
```

### Reusable components
Now, the first thing you're recommended to do, is to reduce repetitions by creating reusable components. A dropdown is something we might want to use elsewhere, so making a generic dropdown component makes sense:

```jsx
export default props => <select onchange={ev => props.onselect(ev.currentTarget.value)}>
    {options.map(opt => (
        <option selected={props.selected === opt}>{opt}</option>
    ))}
</select>
```

Now the view can be written

```jsx
import DropDown from './dropdown'
...
const view = (state, actions) => <main>
    ...
    <h1>Bar: {state.bar.selected}</h1>
    ...
    <DropDown
        options={state.bar.options}
        onselec={actions.bar.select}
        selected={state.bar.selected}
    />
    ...
    <input
        type="text"
        onchange={ev => actions.bar.addOption(ev.currentTarget.value)}
    />
</main>
```

### Module Views

But authoring reusable components is only part of the story. It helps reduce repetition in your view, but it does not fix the problem you see above, which is that the view needs to know a whole lot about the inner structure of the `baroptions` module.

That exposes us to the risk of bugs originating far outside the module (so: hard to track down).

The knowledge of how state and actions are wired into a view, should reside in the same module that defines the state and actions. The module should expose a more simple and "foolproof" access to those view parts.

```jsx
export default _ => ({
    state: {
        selected: null,
        options: [],
    },
    actions: {
        addOption: opt => ({options}) => ({options: options.concat(opt)})
        select: opt => ({selected: opt})
    },
    view: (state, actions) => ({
        Banner: props => <h1>{props.name}: {state.selected}</h1>,
        Input: _ => <input
            type="text"
            onchange={ev => actions.addOption(ev.currentTarget.value)}
        />,
        Selector: _ => <DropDown
            selected={state.selected}
            select={actions.select}
            options={state.options}
        />
    })
})
```

This allows the main view to be written in this way:

```jsx
import baroptions from './baroptions',
...
const view = (state, actions) => {
    const views = {
        baroptions: baroptions.view(state.baroptions, actions.baroptions)
    }
    return <main>
        ...
        <views.baroptions.Banner name="Bar" />
        ...
        <views.baroptions.Selector />
        ...
        <views.baroptions.Input />
    </main>

}
```

## The Module Pattern

So now we finally have the pattern of defining a module:

```js
export default initialValues => ({
    state: {...},
    actions: {...},
    view: (state, actions) => {...},
})
```

Simple and sensible, right?!

> For singleton-modules which don't need to be used multiple times with initial values, you can forgo the function-call wrapper, and simply export the object. Note that the main, top-level module of your app will always be a singleton.


A module which composes other modules inside it could look like this.

### Composing modules

```jsx
import foo from './foo'
import bar from './bar'
import baz from './baz'

const modules = {
    foo: foo(),
    bar: bar(),
    baz: baz(),
}

export default initialValues => ({
    state: {
        foo: modules.foo.state,
        bar: modules.bar.state,
        baz: modules.baz.state,

        someProp: 'A'
        otherProp: 42
    },

    actions: {
        foo: modules.foo.actions,
        bar: modules.bar.actions,
        baz: modules.baz.actions,

        someAction: _ => {...},
        otherAction: _ => {...}
    },

    view: (state, actions) => {
        const views = {
            foo: modules.foo.view(state.foo, actions.foo),
            bar: modules.bar.view(state.bar, actions.bar),
            baz: modules.baz.view(state.baz, actions.baz),
        }

        return /* some combination of:
            - state
            - actions
            - views.foo
            - views.bar
            - views.baz
            */
    }
})
```

It's simple, clean and explicit. It's a lot of repetetive typing though. Surely we can write a helper to fix this? ...Of course we can!

## A Module Helper

```js
const combineModules = tree => {
    const modules = {}
    
    for (let name in (tree.modules || {})) {
        modules[name] = combineModules(tree.modules[name])
    }

    const state = tree.state || {}
    const actions = tree.actions || {}
    
    for (let name in modules) {
        state[name] = modules[name].state || {}
        actions[name] = modules[name].actions || {}
    }

    const view = (state, actions) => {
        const subviews = {}
        for (let name in modules) {
            if (!modules[name].view) continue
            subviews[name] = modules[name].view(
                state[name],
                actions[name]
            )
        }
        return tree.view && tree.view(state, actions, subviews)
    }
    
    return {state, actions, view}
}
```

This little helper essentially implements the pattern above, in a recursive fashion. It expects a module defined like:

```jsx
import foo from './foo'
import bar from './bar'

const {state, actions, view} = combineModels({
    modules: {
        foo: foo(),
        bar: bar(),
    },
    state: {
        rootState1: 'a',
        rootState2: 99,
    },
    actions: {
        rootAction1: ...
        rootAction2: ...
    },
    view: (state, actions, views) => (
        <main>
            <section class="left">
                {state.rootState1}
                <button onclick={actions.rootAction1}>Boo!</button>
                <views.foo.InputForm onsubmit={actions.rootAction2} />
            </section>
            <section class="toolbar>
                <views.foo.ToolbarButton />
                <views.bar.ToolbarButton />
            </section>
            <section class="main">
                <views.bar.Main />
            </section>
        </main>
    )
})
```

`foo()` and `bar()` should return module objects of the same shape. Those may in turn include modules of their own. `combineModules` produces the total `state` and `action` trees, as well as the main `view`, from the provided module-tree.

The third argument passed to the view, is an object with the keys `foo` and `bar`, and the values are the results of calling those modules' respective `view` functions. The `view` functions in `foo` and `bar`, in turn, recieve the views of *their* child-modules in the third arguments.

With the total `state` and `actions` trees, plus the main `view` thus produced, running your app is simply a matter of passing them to `app(state, actions, view, document.body)`

Tada! -- You're running a modular Hyperapp app

## Testability

Modules using this method make good candidates for unit testing! A unit-test might look something like:

```js
test('when foo is set to false, the Bar component renders nothing', done => {
    const {state, actions, view = combineModules(myModule({foo: true}))
    app(state, actions, (state, actions) => {
        if (state.foo) {
            actions.turnFooOff()
            return
        } else {
            const {Bar} = view(state, actions)
            assert(!Bar())
            done()
        }
    })
})
```
> Note: when testing a module with dependencies, you may want to mock them,

Notice the missing 4th parameter to the app call. That's usually where you tell Hyperapp where in the DOM you'd like your app rendered. When you leave it off, Hyperapp disengages the entire virtual-dom rendering routine, but it will *still call the view every update* That is how you can test that your module's "view" responds correctly to actions. 
