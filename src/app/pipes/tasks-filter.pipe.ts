import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tasksFilter',
  pure: false
})
export class TasksFilterPipe implements PipeTransform {

  transform(tasks: any[], selectedTypes: string[]): any[] {
    if (!tasks || !selectedTypes || selectedTypes.length === 0) {
      return tasks; 
    }

    return tasks.filter(task => selectedTypes.includes(task.taskTypeName));
  }
}
