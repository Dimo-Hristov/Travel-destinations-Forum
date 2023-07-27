import { Directive } from '@angular/core';
import { Validator, ValidationErrors, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[appEmail]',
})
export class EmailDirective implements Validator {
  constructor() {}

  validate(control: AbstractControl<any, any>): ValidationErrors | null {
    return null;
  }
}
