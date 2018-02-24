
Some basic rules to live by  with hyperapp and forms:

Here's my general approach to forms and form-validation in hyperapp:

First: the "vanilla-js" approach to form validation, by performing validation in the `onsubmit`, works just fine. The problem is, that if you
want to insert  

Have the value of each field in a state property. For two reasons
- so that when the form rerenders (perhaps because of an error) the values in the fields is preserved. (You could also use keys for this issue)
- so that you can perform validation on the state properties, rather than have to look up the values in the elements.

skip: Vanilla JS form validation. 
d


```js
document
.querySelector('form[name=signup]')
.addEventListener('onsubmit', ev => {
    ev.preventDefault(true)

    const form = ev.currentTarget

    const name       = form.username.value
    const age        = form.age.value
    const email      = form.email.value
    const password   = form.password.value
    const repeatpass = form.rempeatpass.value
    
    if (password !== repeatpass) {
        //attach an error message telling the user
        //that the new passwords don't match
    }

    //...
})
```




skip: Then render the error...
Let's use hyperapp's vdom to render errors. Let's use a form component:

```jsx

const SignupForm = ({error, setError}) => (
    <form name="signup" onsubmit={ ev => {
        const form = ev.currentTarget
        if (form.password.value !== form.repeatpassword.value) {
            setError('new password fields don't match)
        }
        //....
    }}>
        {error && (
            <p class="error">{error}</p>
        )}
        Name: <input type="text" name="username" /><br />
        Age: <input type="number" name="age" /><br />
        Email: <input type="email" name="email" /><br />
        Password: <input type="password" name="password" /><br />
        Repet password: <input type="password" name="repeatpass" /><br />
        <input type="submit" value="Register" />
     </form>
)
```

Immediately, we see a problem with this. If the user enters mismatching passwords, we will set an error, the form will rerender and we will see the error -- but whatever the user had entered in the name, age and email fields will be gone. The only way to preserve the values of those fields, is to keep them in the state, so that we can rerender them.

Let's try this approach: 

```jsx
const SignupForm = ({
    error, setError
    username, setUsername,
    age, setAge,
    email, setEmail,
    password, setPassword
    password2, setPassword2
}) => (
    <form name="signup" onsubmit={ ev => {
        if (
            password &&
            password2 &&
            password !== password2
        )  {
            setError('new password fields don't match)
        } else {
            //do the submit thing.

        }
    }}>
        {error && (
            <p class="error">{error}</p>
        )}
        
        Name: <input
            type="text"
            name="username"
            value={username}
            onchange={ev => setUsername(ev.currentTarget.value)}
        /><br />
        
        Age: <input
            type="number"
            name="age"
            value={age}
            onchange={ev => setAge(ev.currentTarget.value)}
        /><br />

        Email: <input
            type="email"
            name="email"
            value={email}
            onchange={ev => setEmail(ev.currentTarget.value)}
        /><br />

        Password: <input
            type="password"
            name="password"
            value={password}
            onchange={ev => setPassword(ev.currentTarget.value)}
        /><br />

        Repet password: <input
            type="password"
            name="password2"
            value={password2}
            onchange={ev => setPassword2(ev.currentTarget.value)}
        /><br />

        <input type="submit" value="Register" />
    </form>
)
```

Since we know enough to render the error immediately once the user has enetered mismatching passwords, why wait until `onsubmit`? Instead, let's move the validation to an *action* we call, every time the user updates one of the fields:

```js

const state = {
    username: '',
    age: 0,
    email: '',
    password: '',
    password2: ''
},

const actions = {
    setUsername => ({})


}



```