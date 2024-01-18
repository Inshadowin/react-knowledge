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

Here we have different providers and we clearly see what's going on. What our App is using, order of Init and hierarchy of our App.
You can read about providers anywhere, I want to share some tricks.

### Default value

Yes, this "useless" thing for React.createContext

```tsx
const AppContext = React.createContext<AppContextType>({
  loginPopupMode: "login",
  loginPopupVisible: false,

  onSetToLoginMode: () => void 0,
  onSetToRegisterMode: () => void 0,

  onHideLoginPopup: () => void 0,
  onShowLoginPopup: () => void 0,
});
```

Why bother? Well, reality is that you can add anything here that will be a default implementation for your functionality. Most likely stateless, but it can use something that just provides functions. And doesn't bother with State.
Also, you can have something here that will allow you to indicate non-context behavior. So you can just have a Symbol here.
It's an edge-case, but keep that in mind.

### Optional Source

i18n uses this for their translations:
https://github.com/i18next/react-i18next/blob/master/src/useTranslation.js.
As you see, it uses context, but you can just never wrap your App in the provider, it will just default to some other implementation.
That's one of the cases I described in prev. step.

But, there is more to it.
You can have a way to get information from multiple sources.

```jsx
const useMeta = () => {
  const meta =
    useContext(MetaContext) ?? useSelector(state => state.app.meta) ?? {};
  // ... do something
};
```

In this case, you can have a way to override something with Context Wrapper and default to some global state if needed.
This way you can have components/hooks with logic around something, but the source will be optional and contained in one place - this hook.

Of course, if you don't use State Manager, you can still just Wrap your Component with Provider of certain type and have same result.
My take here is that it's possible in more exotic cases - like this, when you already have some Redux in your App.

### Test Proviers

You can just mock things in your tests by having two or more Providers exported with the same type.
And just switch them based on the process.ENV variable.
This is generally not recommended, but it's still possible thing to do.

```jsx
const UserContext = React.createContext();

const RealUserProvider = ({ children }) => (
  <UserContext.Provider>{children}</UserContext.Provider>
); // Fetch data, do some processing, I don't care
const FakeUserProvider = ({ children }) => (
  <UserContext.Provider>{children}</UserContext.Provider>
); // Provide some fake data that you want to override manually. Use your imagination

const UserProvider =
  process.ENV === "TEST" ? FakeUserProvider : RealUserProvider;
export default UserProvider;
```

### Context Expanding

This was a real-life example for micro-service approach where each page was in different bundle. So app had some general localizations, but each service might override it for itself and itself only. Or provide some additional keys.
Each service was loading it's metadata, but how this expansion might look:

```jsx
const LocaleContext = React.createContext(...);
const ServiceLocaleContext = React.createContext(...);
```

Each service would be rendered by a component

```jsx
const ServiceRenderer = ({ Component, locale }) => {
  return (
    <ServiceLocaleContext.Provider value={locale}>
      <Component />
    </ServiceLocaleContext.Provider>
  );
};
```

And our localization was something like this

```jsx
const useTranslation = () => {
  const locale = useContext(LocaleContext);
  const serviceLocale = useContext(ServiceLocaleContext) ?? {};

  const t = key => {
    return serviceLocale[key] ?? locale[key] ?? key;
  };

  return { t };
};
```

And that's it. Expandable real-time localization was achieved just like this

### Optimizations

This will be not an easy topic. Usually people want some things that they don't understand.
Conxtext is like a ring of Power: it binds all to it's will. So when it changes - everyone MUST react.
So any change in the STATE in the Context must be translated.
So this is exactly what happens.
This is why we have so many context's in the first place - we sign-up for some specific information, rather than sign up for ALL and then try to opt. it

But what we need to do sometimes - is to CHANGE context value outside of the component.
So you can't `useContext` there

```jsx
export const AppAuthProviderContext = React.createContext({});

// dirty trick to use function out of context
let handleLogout = () => {};

const AppAuthProvider: React.FC<AppAuthProviderProps> = ({ children }) => {
  const [value, setValue] = useState({ authState: "logged_in" });
  // some code

  const logout = () => {
    // do something with context value
    setValue(v => ({ ...v, authState: "logged_out" }));
  };

  handleLogout = logout;

  // return Something
};

export { handleLogout };
```

Yes, you feel how wrong it is.
But, at the same time it works. Have it in your app for something that is a "Singleton" and you will never have any problems with it.
You can return an object with this function as a field. Or multiple functions at the same time

```jsx
export const AppAuthProviderContext = React.createContext({});

export const loginApi = {};

const AppAuthProvider: React.FC<AppAuthProviderProps> = ({ children }) => {
  const [value, setValue] = useState({ authState: "logged_in" });

  const logout = useCallaback(() => {
    setValue(v => ({ ...v, authState: "logged_out" }));
  }, []);

  useEffect(() => {
    loginApi.logout = logout;
  }, [logout]);
};

export { handleLogout };
```

Just keep in mind order of calls and useEffects trigger. Just in case you want to tigger function that wasn't created yet.
Use this for: Messages, Auth, you name it.

Another way is - split values and api in two contexts

```jsx
export const AppAuthStateContext = React.createContext({});
export const AppAuthApiContext = React.createContext({});

const AppAuthProvider = ({ children }) => {
  const [value, setValue] = useState({ authState: "logged_in" });

  const logout = useCallaback(() => {
    setValue(v => ({ ...v, authState: "logged_out" }));
  }, []);

  const apiValue = useMemo(() => ({ logout }), [logout]);

  return (
    <AppAuthStateContext.Provider value={value}>
      <AppAuthApiContext.Provider value={apiValue}>
        {children}
      </AppAuthApiContext.Provider>
    </AppAuthStateContext.Provider>
  );
};

export const useLoginApi = () => useContext(AppAuthApiContext);
export const useLoginState = () => useContext(AppAuthStateContext);
```

This is generally better if you care about performance of your Logout button

### Context as configuration

You can have Two or more different context Providers for the same Context.
I used this to have a way to configure Read-only mode for some of the Components.

Base idea, no real implementation:

```jsx
export const GeometryContext = React.createContext({});

const EditGeometryContextProvider = ({ children }) => {
  const [value, setValue] = useState({});

  return (
    <GeometryContext.Provider value={{ value, setValue }}>
      {children}
    </GeometryContext.Provider>
  );
};

const ViewGeometryContextProvider = ({ children }) => {
  const [value, setValue] = useState({});

  return (
    <GeometryContext.Provider value={{ value }}>
      {children}
    </GeometryContext.Provider>
  );
};
```

So in your child components you will check if `setValue` is provided. And if not - that means you have `view-only` mode. Pretty useful.
All your base-components will be re-used and you just need to wrap them in correct provider

## Common problems

React isn't perfect by any means. But it provides some cool features that other Frameworks don't. So let's see main issues and how to fix them

### Why it re-mounts

Re-mount, or mount in general happens when:

- Element appears first time
- Element's key changes
- Element's position is changed
- Element's type is changed

Maybe there are more ways to say it, but these cover all cases. So let's dive into each of them

- Element appears first time

Pretty easy. First time component is rendered everything works in unique way: useState initializes value, etc.
It happens without our way to change it. So nothing more to add

- Element's key changes

```jsx
const Component = ({ userId }) => {
  const { user, loading } = useFetch(() => getUser(userId), [userId]);

  return <UserForm key={user.id} user={user} />;
};
```

If you don't have that `key` part - you will have some problems. If your `Component` will have `userId` changed - data will be fetched. But form will not be re-initialized. So it may not update at all, or update partially. That's not good at all

On the other hand - change `key` on your own if you need to re-mount component/element

- Element's position is changed

```jsx
const Component = ({ hasError, error }) => {
  if (hasError) {
    return (
      <div>
        <span>{error}</span>
        <input />
      </div>
    );
  }

  return (
    <div>
      <input />
    </div>
  );
};
```

In this case, if `hasError` changes `<input />` will be re-mounted. Not a big deal, but if it's some interesting Component - you might not want it.
It happens because of react-reconciler (check it out, it's cool). Basically, it checks for hierarchy, and looks at position and element types.
So in this case `<input />` was inside of `div` and on position `1` and switched to postion `0`. That means it will re-mount.
Use conditional rendering in this case, since it will preserve postion

```jsx
const Component = ({ hasError, error }) => {
  return (
    <div>
      {hasError && <span>{error}</span>}
      <input />
    </div>
  );
};
```

- Element's type is changed

Similar to prev. step - type matters. If you construct component type dynamically - you might need to memoize it, or just use render-function

```jsx
const AppRoutes = () => {
  const OurCoolRoute = () => {}; // Whatever
  const OurCoolRoute = useCallback(() => {}, [deps]); // Whatever

  return (
    <Switch>
      // Hello re-mount, my old friend
      <Route component={OurCoolRoute} />
      // Better, but will re-mount on deps change
      <Route component={OurCoolRoute} />
      // This works better
      <Route render={() => <Cool />} />
    </Switch>
  );
};
```

Key difference between `() => <Component />` and `<Component />` is the fact that function is called and `<Component />` = `React.createElement(Component)`. So render function can change as much as you want, but `Component` type stays the same, it just gets props. So nice to know it

### Why it re-renders

### Lists

### Updates in parallel
