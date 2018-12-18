import React from 'react';
import { Dialog } from 'element-react';

import DataForm from './DataForm';



const FormDialog = React.forwardRef(({
  model,
  title,
  size = 'tiny',
  onCancel,
  customClass,
  children,
  ...rest
}, ref) => (
  <Dialog
    title={title}
    visible={Boolean(model)}
    onCancel={onCancel}
    size={size}
    closeOnClickModal={false}
    customClass={customClass}
  >
    <Dialog.Body>
      {children}
      {model
        ? (
          <DataForm
            ref={ref}
            model={model}
            onCancel={onCancel}
            {...rest}
          />
        )
        : null
      }
    </Dialog.Body>
  </Dialog>
));

export default FormDialog;
