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
      environment.supabaseUrl as string,
      environment.supabaseAnonKey as string
    );
  }

  getClient() {
    return this.supabase;
  }

  // Example: Fetch data from a table
  async getData(table: string) {
    // Check if table includes schema
    let schema = 'public';
    let tableName = table;
    
    if (table.includes('.')) {
      const parts = table.split('.');
      schema = parts[0];
      tableName = parts[1];
    }
    
    const { data, error } = await this.supabase
      .schema(schema)
      .from(tableName)
      .select('*');

    if (error) {
      console.error('Error fetching data:', error.message);
      return null;
    }

    return data;
  }

  // Example: Insert data into a table
  async insertData(table: string, newData: any) {
    // Check if table includes schema
    let schema = 'public';
    let tableName = table;
    
    if (table.includes('.')) {
      const parts = table.split('.');
      schema = parts[0];
      tableName = parts[1];
    }
    
    const { data, error } = await this.supabase
      .schema(schema)
      .from(tableName)
      .insert([newData])
      .select();

    if (error) {
      console.error('Error inserting data:', error.message);
      return null;
    }

    return data;
  }

  listenToChanges(houseNumber: string) {
    const channel = this.supabase.channel('realtime:porton' + houseNumber);

    return channel;
  }
}
