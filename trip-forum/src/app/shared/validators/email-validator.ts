import { ValidatorFn } from '@angular/forms';

export function emailValidator(): ValidatorFn {
  const regExp = new RegExp('^[w-.]+@([w-]+.)+[w-]{2,4}$');
  return (control) => {
    return control.value === '' || regExp.test(constrol.value)
      ? null
      : { emailValidator: true };
  };
}
