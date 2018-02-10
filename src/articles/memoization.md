---
title: Memoization
date: 2018-02-10
blurb: An optimization technique for faster renders and making sure `onupdate` is only called when something actually changed.
keywords: memoization, optimation, view, component
---

The general idea with memoization, is to avoid expensive calculations in functions by keeping a memo of the result of previous calls. Whenever you call a memoized function with the same arguments as a previous time, we skip over the actual calculation and simply return the previously calculated result

So memoization is best used only for *pure* functions. Functions who'se only output/effect is the returned value of a calculation, which is only based on input arguments. Also memoization is not free. There is a cost involved in comparing the input values to previous ones, and to storing the old results. You should chose a method apprioriate to the types of input values you'll have, and the calculations involved.

## Memoizing views

If you're composing your main view from sub-views, as described [here](https://zaceno.github.io/hypercraft/post/modular-apps/) (or similar), then your sub-views are pure functions which take a part of the state tree under a namespace: `const fooView = fooModule.view(state.foo, actions.foo))` 

Because of the way hyperapp's state-management works, `state.foo` will be a new instance in the view *only* if some state has changed under `state.foo` -- otherwise, it will be the *same object instance* as the last time the view was called. This offers a perfect opportunity for memoization: the subview represents a significant chunk of the UI, and checking wether the input values have changed is dirt cheap: it's simply a matter of checking if `prevState === state`.

```js
var prevState
var memo
const memoizeView = view => (state, actions) => {
    if (prevState === state) return memo
    prevState = state
    memo = view(state, actions)
    return memo
}

...

fooModule.view = memoizeView(fooModule.view)
```

## Memoizing Components

Memoizing components is a bit more involved than the example above, because

- components take an input argument wich is an object of `attributes`, and unlike the `state` of subviews, you'll typically need to check the properties of the input object, to determine if the arguments have changed 

- unlike subviews, a component is typically called many times every render. This means it's not enough to remember the input from just the previous call. You need to keep track of all the previous inputs and results to reap the benefits of memoization.

Thankfully are plenty of memoization implementations out there which take care of this for you, so you don't need to write it yourself. A popular one is [moize](https://github.com/planttheidea/moize)

### Speeds up rendering

The main reason you'd want to memoize components, is because during the `patch` operation (where hyperapp is busy comparing the old virtual-DOM to the new one, in order to figure out how to change the DOM), whenever a virtual node is encounterd which is the *same instance* as the previous one, it simply skips over that entire branch of the virtual-dom-tree. (See the discussion [here](https://zaceno.github.io/hypercraft/static-vnodes/)).

So, for a memoized component, not only do you not have to recreate the virtual nodes again -- but you *also* spare the `patch` algorithm from processing that part of the virtual tree again. For big, complicated components this might mean *significantly* faster rendering.

### Onupdate only when component-attributes have changed

A common pitfall/surprise beginning Hyperapp:ers encounter is that if you have a component that produces a vnode with an `onupdate` lifecycle-event-handler, they often expect it will only run when one of the components attributes has changed. But this is not the case of course. `onupdate` handlers are run every render.

*But* since that happens as part of the `patch` process, if you memoize the component, you get the expected behavior, because `patch` will only process the vnodes (and call lifecycle events) if something has *actually* changed.
