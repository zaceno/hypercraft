---
title: Cross-namespace Action-calling
blurb: How can an action in a namespace (a k a "slice") call an action outside the namespace?
date: 2018-10-26
keywords: slices, namespace, namespaces, actions, action
---

Using namespaces ("slices") for state lets you avoid very long state-property names. Scoping actions to a namespace makes it easy to update it. See my article on [Modular Apps](https://zaceno.github.io/hypercraft/post/modular-apps/) if this is the first you're hearing about this.

Namespaces are great, but also restrict actions *in* a namespace, from calling other actions *outside* it. And sometimes you really need that.

Usually the need is of the form: "When X happens over here, then Y should happen over there". For example, one namespace might be for syncing data to and from the server, while another is for editing the data. When the data is changed, you want it synced back to the server.

So how do we solve situations like these?

First, ask yourself if the namespace-separation really is helpful. If you can put dependent actions together in the same namespace the problem goes away.

But flattening the state doesn't always make things better.

You can't call "Y" from the action where "X" happens. The view, on the other hand, has access to all the actions. You *could* put the "when X then Y"-logic in the view.

But you want to avoid mixing business-logic and view-logic.

You could use a third-party event-emitter-library to wire the actions together. It's a pretty good solution that goes naturally with the phrasing of the problem as " When X ... then Y...".

But using event emitters can get pretty confusing, and debugging them is difficult.

The pattern I like to use builds on the initialization pattern outlined [here](https://zaceno.github.io/hypercraft/post/initialization). The essence of it is: if actions in a namespace need to call outside actions, pass those outside actions to the `init` action of the namespace. It stores them in the *state*, where they can be called as needed.

Looking at the example I mentioned above: You have a namespace `backend` which loads and saves data.

```js
const actions = {
    foo: {
        load: data => ...,
        ...
    },
    bar: {
        load: data => ...,
        ...
    }
    backend: {
        fetch: id => (state, actions) => {
            fetch(`https://example.com/api/${id}`)
            .then(data => data.json())
            .then(({foo, bar})=> {
                /*
                    Now what? How do we get
                    to: actions.foo.load(foo)?
                */
            })
        }
    }
}
```

We can make sure that `actions.backend.fetch` knows how to call the `load` actions of `foo` and `bar`, by passing them to it at init-time:

```js
const actions = {
    init: _ => (_, actions) => {
        actions.backend.init({
            onfetch: ({foo, bar}) => {
                actions.foo.load(foo)
                actions.bar.load(bar)
            }
        })
    },
    foo: ...,
    bar: ...,
    backend: {
        init: ({onfetch}) => ({onfetch}),
        fetch: id => (state, actions) => {
            fetch(`https://example.com/api/${id}`)
            .then(data => data.json())
            .then(state.onfetch)
        }
    }
}
```

Also, any time the state in `foo` or `bar` changes, we want to persist the data back to the server:

```js
const actions = {
    foo: {
        _set: s => s,
        setX: x => (state, actions) => {
            actions._set({x})
            /*
                We changed the state of foo.X
                Now how do we make backend save {foo, bar}?
            */
        }
    },
    backend: {
        save: ({foo, bar}) => ...
    }
}
```

Same thing:

```js
const actions = {
    getState: _ => s => s,
    init: _ => (_, actions) => {
        actions.backend.init({
            onfetch: ({foo, bar}) => {
                actions.foo.load(foo)
                actions.bar.load(bar)
            }
        })
        
        const doSave = _ => actions.backend.save({
            foo: actions.getState().foo,
            bar: actions.getState().bar,
        })
        
        actions.foo.init({onchange: doSave})
        actions.bar.init({onchange: doSave})
    },
    foo: {
        init: ({onchange}) => ({onchange}),
        _set: s => s,
        setX: x => (state, actions) => {
            actions._set({x})
            state.onchange()
        },
        ...
    },
    bar: { /*... similarly ...*/ },
    backend: {
        init: ({onfetch}) => ({onfetch}),
        save: ({foo, bar}) => ...,
        ...
    }
}
```

There are a downsides to this too, of course. There will be functions stored in the state, which some dislike. It doesn't look especially clean or elegant. Still, the debugability and the fact that all dependencies between slices are kept out of the view makes it my preferred approach to this type of problem. 