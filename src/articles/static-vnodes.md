---
title: Static VNodes
date: 2018-01-29
blurb: Optimization technique for faster rendering when you've got a lot of static html
---

Have a look at [this line](https://github.com/hyperapp/hyperapp/blob/904c3b00adfd2ed8f0bafc130a743f308fa2d3c3/src/index.js#L221) in the Hyperapp source.

```js

 function patch(parent, element, oldNode, node, isSVG, nextSibling) {
    if (node === oldNode) {
    } else if (oldNode == null) {
    ...

```

This means, that if ever a node (a [virtual node](https://github.com/hyperapp/hyperapp/blob/1.0.2/docs/concepts/vnodes.md)) is encountered which
is equal, i e **the same instance** as the corresponding old node, *patching is skipped over completely*. The patch function will not even drill down to make sure to see if anything has changed.

So imagine you have a component like this:

```jsx

export const GameCommentBox = props => <div class="game-comment">
    <div class="game-comment-fancy-heading">
        {props.player === 1 ? "Player One"  : "Player Two"}
    </div>
    <div class="game-comment-move">{props.move}</div>
    <div class="game-comment-fancy-footer"></div>
</div>
```

Especially if there are many such components in a list (as one can imagine for the example abpve), you can spare the rendering a lot of effort wasted on checking virtual nodes that haven't changed, by defining the static parts as constants:

```jsx

const Heading = player => <div class="game-comment-fancy-heading">{player}</div>
const P1HEADING = Heading('Player One')
const P2HEADING = Heading('Player Two')
const FOOTER = <div class="game-comment-fancy-footer"></div>

export const GameCommentBox = props => <div class="game-comment">
    {props.player === 1 ? P1HEADING : P2HEADING}
    <div class="game-comment-move">{props.move}</div>
    {FOOTER}
</div>

```

This saves the patch function from delving into the heading and footer for every "game comment" because each time it will be not only the same shape but the very same *instance* of vnode. The concept can be extended to *memoization* of components, but that's a topic for another time.