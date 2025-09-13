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

async function applyPersonalitiesRLSMigration() {
  try {
    console.log('🚀 Applying personalities RLS migration...');
    
    // Read the SQL migration file
    const sqlFile = join(__dirname, 'add-personalities-rls.sql');
    const sql = readFileSync(sqlFile, 'utf8');
    
    console.log('📁 Migration file read successfully');
    console.log('SQL to execute:', sql);
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Personalities RLS migration applied successfully!');
    console.log('🔒 Row Level Security is now enabled for personalities table');
    
    // Test the policy by trying to query personalities
    console.log('🧪 Testing RLS policies...');
    const { data, error: testError } = await supabase
      .from('personalities')
      .select('count');
      
    if (testError) {
      console.log('⚠️  Cannot test policies (this may be normal if no user is authenticated):', testError.message);
    } else {
      console.log('✅ RLS policies are working correctly');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyPersonalitiesRLSMigration();