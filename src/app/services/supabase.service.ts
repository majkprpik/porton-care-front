import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  getClient() {
    return this.supabase;
  }

  // Example: Fetch data from a table
  async getData(table: string) {
    const { data, error } = await this.supabase
      .from(table)
      .select('*');

    if (error) {
      console.error('Error fetching data:', error.message);
      return null;
    }

    return data;
  }

  // Example: Insert data into a table
  async insertData(table: string, newData: any) {
    const { data, error } = await this.supabase
      .from(table)
      .insert([newData]);

    if (error) {
      console.error('Error inserting data:', error.message);
      return null;
    }

    return data;
  }
}
