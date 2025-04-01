import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByType',
  standalone: true
})
export class FilterByTypePipe implements PipeTransform {
  transform(items: any[], property: string, typeId: number): any[] {
    if (!items || !property || typeId === undefined) {
      return items;
    }
    return items.filter(item => item[property] === typeId);
  }
}
