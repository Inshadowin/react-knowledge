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
