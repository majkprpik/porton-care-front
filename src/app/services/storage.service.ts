import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(
      private supabase: SupabaseService,
  ) { 

  }

  async storeImageForTask(image: any, taskId: number) {
    try {  
      const compressedImage = await this.compressImage(image, 1);

      const filePath = 'task-' + taskId + '/' + compressedImage.name;
  
      const { data, error: storeImageError } = await this.supabase.getClient()
        .storage
        .from('damage-reports-images')
        .upload(filePath, compressedImage);
      
      console.log('Upload response: ' + data);
      if (storeImageError) throw storeImageError;

      const publicUrl = this.supabase.getClient()
        .storage
        .from('damage-reports-images')
        .getPublicUrl(data.path).data.publicUrl;
    
      return { path: data.path, url: publicUrl };
    } catch (error: any) {
      console.error('Error storing image:', error);
      return { error: error.message || "Error storing image in Supabase" };
    }
  }

  async getStoredImagesForTask(taskId: number){
    try {
      const folderPath = 'task-' + taskId;

      const { data: files, error: listError } = await this.supabase.getClient()
        .storage
        .from('damage-reports-images')
        .list(folderPath);

      if (listError) throw listError;

      return files;
    } catch(error) {
      console.log('Error fetching images: ' + error)
      return null;
    }
  }

  async getPublicUrlForImage(filePath: string) {
    try {
      const response: any = await this.supabase
        .getClient()
        .storage
        .from('damage-reports-images')
        .getPublicUrl(filePath);
  
      if (response && response.data && response.data.publicUrl) {
        return response.data.publicUrl;
      }
  
      if (response && response.error) {
        console.error('Error getting public URL:', response.error);
        return null;
      }
  
      console.error('Public URL not found or unknown error');
      return null;
  
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  }

  async getAllStoredImagesInBucket(bucketName: string){
    try {
      const { data: files, error: listError } = await this.supabase.getClient()
        .storage
        .from(bucketName)
        .list();

      if (listError) throw listError;

      return files;
    } catch(error) {
      console.log('Error fetching images: ' + error)
      return null;
    }
  }

  private async compressImage(image: File, targetMegaBytes: number){
    const options = {
      maxSizeMB: targetMegaBytes, 
      maxWidthOrHeight: 1920, 
      useWebWorker: true,
    };

    const compressedImage = await imageCompression(image, options);

    return compressedImage;
  }
}
