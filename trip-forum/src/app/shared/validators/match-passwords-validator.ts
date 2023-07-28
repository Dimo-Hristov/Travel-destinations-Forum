import { FormGroup, ValidatorFn } from '@angular/forms';

export function passwordsValidator(pass: any, rePass: any): ValidatorFn {
  return (control) => {
    const group = control as FormGroup;
    const pass1 = group.get(pass);
    const pass2 = group.get(rePass);
    return pass.value === rePass.value ? null : { passwordsValidator: true };
  };
}
