---
title: Stateful Components
date: 2018-01-19
blurb: Stateful components with hyperapp - how to do it, and when you might want to.
---


## A frequently asked question

Just about every new user of hyperapp at some point asks the question: "How can I make
components with local state?"

In React, for example, there are *object-components* with
render methods, and `.setState()`. In Vue.js, every component has its `.props`. Such components encapsulate state and behavior locally, keeping it out of the rest of the app (because it's only relevant internally to the component). 

But Hyperapp's design is clear: there is one single state store, and components are purely functional. So components with local state are off the table ... right?

The trick is to realize that a stateful component is essentially a simple *app*, exposing an interface for interacting with it from the outside. The interface is such that it allows for composing with other components in a larger app.

## Reusing an app ... in an app!

Let's begin with this, small simple gif-search app:

<div style="width: 150%; position: relative; left: -25%">
<p data-height="600" data-theme-id="dark" data-slug-hash="WdLPBZ" data-default-tab="js,result" data-user="zaceno" data-embed-version="2" data-pen-title="gif search hyperapp" class="codepen">See the Pen <a href="https://codepen.io/zaceno/pen/WdLPBZ/">gif search hyperapp</a> by Zacharias Enochsson (<a href="https://codepen.io/zaceno">@zaceno</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script></div>


Imagine now you're working on some kind of larger social-app, where one feature is for a user to use a gif to diplay their mood. You'd like to use the gif-search app you already built above, as the mechanism for finding and selecting the appropriate mood-gif.

An simplified version of the app you'd like to write, might then look like this:

```jsx

app(
    //STATE
    {
        gif: null,
        selecting: false,
    },

    //ACTIONS 
    {
        select: _ => ({selecting: true}),

        onselect: url => ({
            gif: url,
            selecting: false,
        })
    },

    //VIEW
    (state, actions) => (
        <main>
            <h1>I feel like:</h1>
            <img src={state.gif} />
            <br />
            {
                state.selecting
                ? <GifSearch onselect={actions.onselect} />
                : <button onclick={actions.select}>Select GIF</button>
            }
        </main>
    ),

    //CONTAINER
    document.body
)

```

Even though the `<GifSearch />` component doesn't exist yet, it's clear what we want to
achieve:

1. When the user clicks the "Select GIF"-button, we should render the gif search app.
2. When the user clicks (or somehow "selects") one of the gifs, we expect a callback, with the url to the selected gif.
3. The newly selected gif is displayed. Simultaneously, the gif search dissapears. 

It is also clear that we don't expect to have to handle any of the search component's state or
actions in the main app.

The first step is to make sure that when we render `<GifSearch />`, we start the search app and render it at that place in the DOM:

```js

const GifSearch = props => h('gif-search', {
    oncreate: element => {
        const actions = app(
            gifSearchState,
            gifSearchActions,
            gifSearchView,
            element,
        )
    }
})
```


With this, the `<GifSearch />` component produces an `UnkonwnHTMLElement` in the DOM with the tag name `gif-search`. *When* the element is created, we initiate the search app with the element as it's container.

Now, the question is what to do with the `onselect` property we pass to the `<GifSearch />` component? We need to somehow make the search app is aware of the callback, and make use it to call back when the user selects a gif.

Did you notice the generic `update` action in the gif-search app above?

```js
const actionDefinitions = {
    update: x => x,
    ...

```

... all it does is update the state with whatever partial-state you pass it as the argument. The search app uses it to set the state before and after performing the search. But since an app's actions are returned from the `app(...)` call, we have access to it, and can use it to inject the component's state with whatever props are passed from the main app -- in particular the `onselect` callback.



```js

const GifSearch = props => h('gif-search', {
    oncreate: element => {
        const actions = app(
            gifSearchState,
            gifSearchActions,
            gifSearchView,
            element,
        )
        actions.update(props) //<------ THIS
    }
})
```

This means the `onselect` callback is available in the state of the search app. So let's add a click-handler to the images, so that `onselect` is called when a gif-thumbnail is clicked:

```jsx
<img key={gif} src={gif} width="80" height="80" onclick={_ => state.onselect(gif)} />

```

This is enough to turn our gif-search app into a reusable component for the example app above:


<div style="width: 150%; position: relative; left: -25%">
<p data-height="600" data-theme-id="dark" data-slug-hash="qpgzre" data-default-tab="js,result" data-user="zaceno" data-embed-version="2" data-pen-title="gif search hyperapp - 2" class="codepen">See the Pen <a href="https://codepen.io/zaceno/pen/qpgzre/">gif search hyperapp - 2</a> by Zacharias Enochsson (<a href="https://codepen.io/zaceno">@zaceno</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
</div>


## Generalizing the pattern

So that works, but of course it would be even nicer to have a function that could make our stateful component for us.

```js
const GifSearch = appComponent(
    gifSearchState,
    gifSearchActions,
    gifSearchView,
    'gif-search'
)
```

...using the pattern we had before:

```js

const appComponent = (initialState, actionDefinitions, view, tagName) =>
    props =>
        h(tagName, {
            oncreate: element => {
                const actions = app(
                    initialState,
                    actionDefinitions,
                    view,
                    element,
                )
                actions.update(props)
            }
        })

```

While that worked for the example above, there are some significant deficiencies if we want to
use `appComponent` more generally.

First: It is not enough to call the update
function just when the element is created -- we must call it everytime the main app rerenders, to make the sub-app aware of prop changes.

Since the same element will be provided to both the `oncreate` and `onupdate` lifecycle methods, that's an opportuninty to store the `update` action, so that we can call it in `onupdate` as well as in `oncreate`.

```js

const appComponent = (initialState, actionDefinitions, view, tagName) =>
    props =>
        h(tagName, {
            oncreate: element => {
                const actions = app(
                    initialState,
                    actionDefinitions,
                    view,
                    element,
                )
                actions.update(props)
                element._update = actions.update  // <----  THIS
            },
            onupdate: element => element._update(props)  // <--- THIS
        })

```

Of course, we can't rely on the `actionDefinitions` to *have* an `update` action. To be safe, we need to add such an action ourselves. We'll use a name that is unlikely to be used, to avoid naming collisions:

```js
const appComponent = (initialState, actionDefinitions, view, tagName) =>
    props =>
        h(tagName, {
            oncreate: element => {
                actionDefinitions._$update = x => x // <--- THIS
                const actions = app(
                    initialState,
                    actionDefinitions,
                    view,
                    element,
                )
                actions._$update(props)
                element._update = actions._$update
            },
            onupdate: element => element._update(props)
        })

```

Finally, since it's important that the element doesn't change between `oncreate` and subsequent `onupdate`-calls, the user will likely want to key their components. So let's make sure to pass along them to the vnode:

```js
const appComponent = (initialState, actionDefinitions, view, tagName) =>
    props =>
        h(tagName, {
            key: props.key // <--- THIS
            oncreate: element => {
                actionDefinitions._$update = x => x
                const actions = app(
                    initialState,
                    actionDefinitions,
                    view,
                    element,
                )
                actions._$update(props)
                element._update = actions._$update
            },
            onupdate: element => element._update(props)
        })

```

## Finally

Now that you made it through this article, and you know how to write a function to turn app definitions into stateful components, the prize is: you'll never have to!

See [hyperapp-nestable](https://github.com/zaceno/hyperapp-nestable) which implements almost exactly this pattern. (It also adds the feature of having an initialization action and an ondestroy action)

The final example of our mood-gif display, with reusable gif-search component, using hyperapp-nestable is here.

<div style="width: 150%; position: relative; left: -25%">
<p data-height="600" data-theme-id="dark" data-slug-hash="ppGMyB" data-default-tab="js,result" data-user="zaceno" data-embed-version="2" data-pen-title="gif search hyperapp - 3" class="codepen">See the Pen <a href="https://codepen.io/zaceno/pen/ppGMyB/">gif search hyperapp - 3</a> by Zacharias Enochsson (<a href="https://codepen.io/zaceno">@zaceno</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
</div>