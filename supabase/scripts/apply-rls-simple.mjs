import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSMigration() {
  try {
    console.log('🚀 Applying personalities RLS migration...');
    
    // Read the RLS migration file
    const rlsSql = readFileSync(join(__dirname, 'add-personalities-rls.sql'), 'utf8');
    
    console.log('📁 Migration file read successfully');
    console.log('SQL to execute:', rlsSql);
    
    // Execute the RLS migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql: rlsSql });
    
    if (error) {
      console.error('❌ RLS migration failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If exec_sql doesn't exist, we'll get a specific error
      if (error.message.includes('function exec_sql') || error.code === '42883') {
        console.log('📝 exec_sql function does not exist. Creating it first...');
        
        // Try to create exec_sql function first
        const execFunctionSql = readFileSync(join(__dirname, 'create-exec-function.sql'), 'utf8');
        
        // We need to use a raw SQL approach since exec_sql doesn't exist
        console.log('⚠️  You need to manually run the SQL in Supabase dashboard:');
        console.log('='.repeat(50));
        console.log(execFunctionSql);
        console.log('='.repeat(50));
        console.log('Then run this script again.');
        process.exit(1);
      }
      
      process.exit(1);
    }
    
    console.log('✅ Personalities RLS migration applied successfully!');
    console.log('🔒 Row Level Security is now enabled for personalities table');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyRLSMigration();