import { Pipe, PipeTransform } from '@angular/core';
import { CleaningPerson } from '../models/cleaning-person.interface';

@Pipe({
  name: 'staffRoles'
})
export class StaffRolesPipe implements PipeTransform {

  transform(cleaningPeople: CleaningPerson[], role: string): CleaningPerson[] {
    return cleaningPeople.filter(person => person.role === role.toLowerCase());
  }
}
