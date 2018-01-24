---
title: Decorator Components
date: 2018-01-24
blurb: JSX-compatible pseudo-components which modify their children
---

Quite often your app has behaviors which apply generally to many part of your UI.
Rather than repeat this behavior in many components, you want to find a way to encapsulate
it in a reusable form.

One way, is to encapsulate the behavior in components which do not themselves produce vnodes,
but rather modify and return their children.

Imagine for example, you've got a bunch of nodes in your app, where you'd like a class added
when the mouse hovers them. You could write a component such as this:

```js

const ClassOnHover = (props, children) => children.map(child => {
    if (child.props) {
        child.props.onmouseover: ev => ev.currentTarget.classList.add(props.class)
        child.props.onmouseout: ev => ev.currentTarget.classList.remove(props.class)
    }
    return child
})

```

An explanation of what it does:

By the time this component is called, the children have been evaluated and turned into
vnodes. When you write `<div foo="bar">'hello'</div>` in your view, that gets transformed into a
vnode of the shape: 

```js
{
    name: 'div',
    props: {
        foo: 'bar'
    },
    children: [
        'Hello'
    ]
}
```

So by setting `children[i].props.onmouseover = ...` and returning the `children` it is as if
we had written the onmouseover in the child declarations in the frist place. Simple as that!
Now you can use it like this:

```jsx

<ClassOnHover class="highlight">
    <p>This p gets the class "highlight" on mouseover. So does the button below</p>
    This textnode does not get affected though :(
    <button>Boop!</button>
</ClassOnHover>

```

There's one significant problem with the decorator component above though: it *overwrites* any
`onmouseover` and `onmouseout` defined in the immediate children. A smarter strategy would be
to *combine* the handlers with the child's handlers.

```jsx

function stackHandlers (props, name, handler) {
    let orig = props[name]
    props[name] = (!orig ? fn : (...args) => {
        orig(...args)
        fn(...args)
    })
}

...


const ClassOnHover = (props, children) => children.map(child => {
    if (child.props) {
        stackHandlers(child.props, 'onmouseover', ev => ev.currentTarget.classList.add(props.class))
        stackHandlers(child.props, 'onmouseout', ev => ev.currentTarget.classList.add(props.class))
    }
    return child
})


```

> This will set the decorator handler on the props, if there is no original handler
> But if there is, it will set a handler that runs both in sequence.

This way you can also stack multiple decorators and they will all do their job.

If you find yourself creating a lot of decorator components, you may appreciate this
little helper:

```js
const decorator = getDeco => (props, children) => {
    const decorations = getDeco(props)
    return children.map(child => {
        if (!child.props) return child
        for (let name in decorations) {
            if (name === 'class') {
                child.props.class = child.props.class + ' ' + decorations.class
            } else if (name.substr(0, 2) === 'on') {
                stackHandler(child.props, name, decorations[name])
            } else {
                child.props[name] = decorations[name]
            }
        }
        return child
    })
}
```

Notice that we're using the `stackHandlers` just as before -- for any prop that starts
with `on`. That means we're able to combine lifecycle events as well. 

Also notice I added a "combiner" for the `class` prop. Often if you want a component
that add's a class to the children, that's what you want.
Any other props the decorator provides are just set on the child's `props`. You'll
have to take care not to overwrite anything important.

Furthermore, notice how we pass the `getDeco` function as an argument, and call it
to find out the decorations to apply. That is so the decorations can be dynamically
dependent on the props passed to the decorator component. 

You'd use the `decorator` function to create the `ClassOnHover` component above, like
this:

```js
const ClassOnHover = decorator(props => ({
    onmouseover: ev => ev.currentTarget.classList.add(props.class),
    onmouseout: ev => ev.currentTarget.classList.remove(props.class)
}))
```

Finally, here's a [live example](https://codepen.io/zaceno/pen/vpwVmp?editors=0010) showing that it works.