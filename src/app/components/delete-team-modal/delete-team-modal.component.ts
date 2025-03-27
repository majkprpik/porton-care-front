import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-team-modal',
  imports: [
    MatDialogModule
  ],
  templateUrl: './delete-team-modal.component.html',
  styleUrl: './delete-team-modal.component.scss'
})
export class DeleteTeamModalComponent {
  
  constructor(
    public dialogRef: MatDialogRef<DeleteTeamModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
  }

  onNoClick(): void{
    this.dialogRef.close();
  }
}
