import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'count',
  standalone: true
})
export class CountPipe implements PipeTransform {
  transform(items: any[]): number {
    return items?.length || 0;
  }
}
