---
title: Keying Components
date: 2018-01-14
blurb: A decorator for `h` to allow keying components (when using JSX)
keywords: virtual dom, keys, components
---

You have a component:

```jsx
const Something = props => (
    <div class="something">
        {/* ... complex stuff ... */}
    </div>
)
```

And you use it in your view:

```jsx
const view = (state, actions) => <main>
    ...
    <Something foo={bar} />
    <Something baz={bing} />
    ...
</main>
```

Now, let's say you realize you need to key your components for some reason -- so you do:

```jsx
const view = (state, actions) => <main>
    ...
    <Something foo={bar} key="fookey"/>
    <Something baz={bing} key="barkey" />
    ...
</main>
```

On it's own, this doesn't work. Not without updating the implementation of the component.
Because `<Something ...>` doesn't represent a vnode in itself: it's only a *call* to a function
which returns a vnode. And that vnode is where you want the key.


So the component implementation needs to change to:

```jsx
const Something = props => (
    <div class="something" key={props.key}>
        {/* ... complex stuff ... */}
    </div>
)
```

It is the context in which the component is *used* which determines wether or not keys are needed. The `key={props.key}` we added is not *always* required. It is not relevant to the internal logic of the component. One might even argue it's *wrong* to put it there. At least, I know it annoys me when I have to do it ;)

Could we make it so that keying *any* component automatically adds the key to the top vnode it returns?

Why, yes -- we can! At least when using JSX, because `<Something key="foo" />`, compiles to
`h(Something, {key: 'foo'})`, where `h` is configured with the jsx pragma `/** @jsx h */` at the top of your file.

So let's replace Hyperapp's `h` with our own:

```jsx
import {h as _h, app} from 'hyperapp'

function h (name, props, ...children) {
    const node = _h(name, props, ...children)
    if (typeof name === 'function') node.props.key = props.key
    return node
}

/** @jsx h */

// Now keys on JSX components are automatically
// set on their top vnodes
// ...
```

This trick works even if you're not using JSX, of course. You just need to make sure to use your `h` to call the component-function:  `h(Something,{key:"foo"})` rather than the straightforward `Something({key:"foo"})`
