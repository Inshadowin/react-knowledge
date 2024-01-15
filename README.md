# react-knowledge

Repo with a set of ideas and patterns to use

# Contents

This will have anyting: starting from code exapmles, and ending with general ideas on projects

## Propper poppers

Z-index is a crutch. We can use something like react-popper, or just use other packages. But we will end up using Z-index at some point. So combinations of Dropdowns, Tooltips, Modals, Poppers, etc. will break at some point. You will have Modal with Dropdown. Fine. Add z-index for that. But can you really handle all the combinations? No. There will be a point, when something must overlap in different way.

So you will add class for that. And so on, and so on

Sollution

```jsx
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

const Portal = ({ children }) => {
  const [container] = useState(() => document.createElement("div"));

  useEffect(() => {
    document.body.appendChild(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  return ReactDOM.createPortal(children, container);
};

export default Portal;
```

If you can write our own UI (and you will do it. even if you adapt something, you will find yourself re-writting almost everything, YAY)
Don't use any z-index EVER

Have any of your components to be inside of this Portal. It creates new div, that will have top-priority for display
If that's a Tooltip, a Modal, or anything. Use any tool that works with position, and apply that style

```jsx
const Demo = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)} />
      {!!open && (
        <Portal>
          <Modal />
        </Portal>
      )}
      <div>
        Text for tooltip
        <Portal>
          <Tooltip />
        </Portal>
      </div>
    </div>
  );
};
```

## It's all in context

I'm not a fan of State managers. One of the reasons - you might not actually need them. We have Redux, Redux-Saga, Thunk, etc. All for making things that are already in the React + JS. And state managers use React.context under the hood. So maybe, you only need that?
General idea and example from real project

```jsx
const App = () => {
  return (
    <ThemeProvider>
      <LanguageContext>
        <AppContext>
          <AuthProviderContext>
            <UserContext>
              <CurrenciesContext>
                <BrowserRouter>
                  <Routes />
                </BrowserRouter>
              </CurrenciesContext>
            </UserContext>
          </AuthProviderContext>
        </AppContext>
      </LanguageContext>
    </ThemeProvider>
  );
};
```

Here we have different providers and we clearly see what's going on. What our App is using, order of Init and hierarchy of our App
You can read about providers anywhere, I want to share some tricks

### Default value

Yes, this "useless" thing for React.createContext

```tsx
const AppContext = React.createContext<AppContextType>({
  loginPopupMode: 'login',
  loginPopupVisible: false,

  onSetToLoginMode: () => void 0,
  onSetToRegisterMode: () => void 0,

  onHideLoginPopup: () => void 0,
  onShowLoginPopup: () => void 0,
});
```

Why bother? Well, reality is that you can add anything here that will be a default implementation for your functionality. Most likely stateless, but it can use something that just provides functions. And doesn't bother with State
Also, you can have something here that will allow you to indicate non-context behavior. So you can just have a Symbol here
It's an edge-case, but keep that in mind

### Optional Source

i18n uses this for their translations
https://github.com/i18next/react-i18next/blob/master/src/useTranslation.js
As you see, it uses context, but you can just never wrap your App in the provider, it will just default to some other implementation
That's one of the cases I described in prev. step

But, there is more to it
You can have a way to get information from multiple sources

```jsx
const useMeta = () => {
  const meta = useContext(MetaContext) ?? useSelector(state => state.app.meta) ?? {}
  // ... do something
}
```

In this case, you can have a way to override something with Context Wrapper and default to some global state if needed
This way you can have components/hooks with logic around something, but the source will be optional and contained in one place - this hook

OF course, if you don't use State Manager, you can still just Wrap your Component with Provider of certain type and have same result
My take here is that it's possible in more exotic cases - like this, when you already have some Redux in your App

### Test Proviers

You can just mock things in your tests by having two or more Providers exported with the same type
And just switch them based on the process.ENV variable
This is generally not recommended, but it's still possible thing to do

```jsx
const UserContext = React.createContext();

const RealUserProvider = ({ children }) => <UserContext.Provider>{children}</UserContext.Provider> // Fetch data, do some processing, I don't care
const FakeUserProvider = ({ children }) => <UserContext.Provider>{children}</UserContext.Provider> // Provide some fake data that you want to override manually. Use your imagination

const UserProvider = process.ENV === "TEST" ? FakeUserProvider : RealUserProvider
export default UserProvider;
```

### Context Expanding

This was a real-life example for micro-service approach where each page was in different bundle. So app had some general localizations, but each service might override it for itself and itself only. Or provide some additional keys
Each service was loading it's metadata, but how this expansion might look:

```jsx
const LocaleContext = React.createContext(...);
const ServiceLocaleContext = React.createContext(...);
```

Each service would be rendered by a component

```jsx
const ServiceRenderer = ({Component, locale}) => {
  return <ServiceLocaleContext.Provider value={locale}>
    <Component />
  </ServiceLocaleContext.Provider>
}
```

And our localization was something like this

```jsx
const useTranslation = () => {
  const locale = useContext(LocaleContext);
  const serviceLocale = useContext(ServiceLocaleContext) ?? {};

  const t = (key) => {
    return serviceLocale[key] ?? locale[key] ?? key
  }

  return { t };
}
```

And that's it. Expandable real-time localization was achieved just like this

### Optimizations

This will be not an easy topic. Usually people want some things that they don't understand
Conxtext is like a rind of Power: it binds all to it's will. So when it's will changes - everyone MUST react
So any change in the STATE in the Context must be translated.
So this is exactly what happens
This is why we have so many context's in the first place - we sign-up to some specific information, rather than sign up to ALL and then try to opt. it

But what we need to do sometimes - is to CHANGE context value outside of the component
