---
title: Decorator Components
date: 2018-01-23
blurb: JSX-compatible pseudo-components which modify their children
---

There are many cases where there's a type of behavior you'd like to apply
to components in general. It'd be nice to be able to say:

```jsx
<Draggable>
    <Thumbnail img={someimg}>
</Draggable>

...

<Draggable>
    <ContactCard person={somePerson} />
</Draggable>
```

The idea here is that `<Draggable />` is *not* a component in the
usual sense, which wrapps `<Thumbnail />` or `<ContactCard />` in a vnode of it's own
creation. Instead, it *modfies* it's children somehow, and then returns it. In this case,
the modification would consist of adding a bunch of properties and event-handlers to
it's children to make them draggable, such as `draggable="true"`, `ondragstart: ev => ...`, 
et c.

A JSX component such as this

```jsx
<MyComponent foo="bar">
    <ChildComponent1 />
    <ChildComponent1 />
</MyComponent>
```

will be transformed into this call:

```js
MyComponent({foo: "bar"}, [ChildComponent1(...), ChildComponent2(...)])

```

The first thing we notice is that we don't know if we'll have one or more children.
The only assumption we can make, is that if we have multiple children, the "decoration"
(= transformation) we intend with our decorator-component, will have to apply to every
individual child






you'd like to encapsulate certain behavior in a reusable component,
but such a component shouldn't produce a