---
title: Utility Actions
date: 2018-01-24
blurb: Generic actions and their uses
keywords: actions, setter, reducer
---

## Generic setter

Complex actions often need to call multiple child actions.

```js
const actions = {

    validate: _ => state => ({valid: validationCheck(state)}),

    _setFoo: x => ({foo: x}),

    _setBar: x => ({bar: x}),

    setFoo: x => (state, actions) => {
        actions._setFoo(x)
        actions.validate()
    },

    setBar: x => (state, actions) => {
        actions._setBar(x)
        actions.validate()
    },
}
```

The reason code ends up looking like the above, is because an action can only update the state by returning a partial state. So unless you want to repeat your validation code a lot of places, the `set...` actions need to use a separate action to set the prop, and then call the validation action.


The above could be made much simpler with a setter:

```js

set: x => x

```

That way, the extra `_set...` can be replaced simply with:

```js
const actions = {

    set: x => x,

    validate: _ => state => ({valid: validationCheck(state)}),

    setFoo: x => (state, actions) => {
        actions.set({foo: x})
        actions.validate()
    },

    setBar: x => (state, actions) => {
        actions.set({bar: x})
        actions.validate()
    }
}
```


## Generic reducer

The `set` functions like above are also useful in actions that perform async operations such
as fetch:

```js

fetchData: id => (state, actions) => {
    fetch(`http://example.com/data/${id}`)
    .then(res => res.json())
    .then(data => actions.set({data}))
}

```

...but what if the resulting data we wish to set depends on the current state?

We might try:

```js

fetchData: id => (state, actions) => {
    fetch(`http://example.com/data/${id}`)
    .then(res => res.json())
    .then(data => actions.set({
        data: state.data + data
    }))
}

```

...but because the fetch is async, the state we have *may be old*! Setting the result in this way would overwrite any changes to `state.data` that happened while we were 
waiting for the request to finish.

Since you alway get the latest state when you call an action, the simple solution is
*not* to set data directly in `.then()` but to set it in an action:

```js

didFetchData: data => state => ({data: state.data + data}),

fetchData: id => (state, actions) => {
    fetch(`http://example.com/data/${id}`)
    .then(res => res.json())
    .then(actions.didFetchData)
}

```

However this means you need to create a `didFetchFoo` action to correspond with every
`fetchFoo`.

A more ergonomical solution would be to use a *generic reducer action* such as this:

```js

reduce: fn => state => fn(state),

fetchData: id => (state, actions) => {
    fetch(`http://example.com/data/${id}`)
    .then(res => res.json())
    .then(data => actions.reduce(state => {
        data: state.data + data
    }))
}

``` 

Incidentally, a generic reducer could also be used to simplify the non-async validation example above, as such:

```js
const actions = {

    set: x => x,
    reduce: fn => state => fn(state)

    validate: props => (state, actions) => {
        actions.set(props)
        actions.reduce(state => {
            valid: validationCheck(state)
        })
    }

    setFoo: x => (state, actions) => actions.validate({foo: x})

    setBar: x => (state, actions) => actions.validate({bar: x})
}
```

(wether or not that's really simpler is subjective, perhaps)


## The problem of scope

The annoying thing about using utility functions such as these, are that actions are only able to call actions from within their branch of the action tree. So you can't make single `set` and `reduce` actions at the top of the tree and hope to call them from any action lower down. You need to replicate them at every level you want to use them.

This is an example of the more general problem of  composing actions from different branches of the action tree (like: "when x happens here, that makes y happen over there"). There should be some nice simple solution to it, but I haven't found it yet. I will be exploring this more in the future.