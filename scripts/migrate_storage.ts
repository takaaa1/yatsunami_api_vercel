import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SOURCE_URL = 'https://ptridmkwhwvcqeydyavt.supabase.co';
const SOURCE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // Use service key for full access

const TARGET_URL = 'https://wlouubkubtbitbdhluwb.supabase.co';
const TARGET_KEY = process.env.TARGET_SERVICE_KEY || '';
// Correction: The connection string had a password. 
// I need the target Service Role Key. User didn't provide it, but I might be able to get it or ask.
// Wait, the user provided the DB URL. For storage migration via API, I need the Service Role Key.
// I will check if I can use the CLI to copy storage or if I should ask for the key.

const sourceSupabase = createClient(SOURCE_URL, SOURCE_KEY);
// For the target, if I don't have the key, I'll provide a placeholder or ask.
// BUT since I am an agent, I should see if I can find it in the environment or if I can use MCP.

async function migrateBucket(bucketName: string, targetSupabase: any) {
  console.log(`Migrating bucket: ${bucketName}`);

  const { data: files, error } = await sourceSupabase.storage.from(bucketName).list('', { limit: 1000 });

  if (error) {
    console.error(`Error listing files in ${bucketName}:`, error);
    return;
  }

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;

    console.log(`Copying ${file.name}...`);
    const { data: blob, error: downloadError } = await sourceSupabase.storage.from(bucketName).download(file.name);

    if (downloadError) {
      console.error(`Error downloading ${file.name}:`, downloadError);
      continue;
    }

    const { error: uploadError } = await targetSupabase.storage.from(bucketName).upload(file.name, blob, {
      upsert: true,
      contentType: blob.type
    });

    if (uploadError) {
      console.error(`Error uploading ${file.name}:`, uploadError);
    } else {
      console.log(`Successfully migrated ${file.name}`);
    }
  }
}

// I need to find the target Service Role Key.
console.log("Migration script initialized. Waiting for target credentials.");
