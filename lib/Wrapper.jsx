import React from 'react';

export default function Wrapper({ Component = React.Fragment, children, ...props }) {
  return <Component {...(Component !== React.Fragment ? props : {})}>{children}</Component>;
}
