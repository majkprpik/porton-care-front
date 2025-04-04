import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tasksSort'
})
export class TasksSortPipe implements PipeTransform {

  transform(tasks: any[] | undefined): any[] {
    if(!tasks){
      return [];
    }

    return tasks.sort((a, b) => {
      if (a.index === null) return 1; 
      if (b.index === null) return -1;
      return a.index - b.index;
    });
  }
}
