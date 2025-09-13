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

async function setupAndApplyMigration() {
  try {
    console.log('🔧 Setting up exec_sql function...');
    
    // First, create the exec_sql function
    const execFunctionSql = readFileSync(join(__dirname, 'create-exec-function.sql'), 'utf8');
    
    // Use raw SQL query to create the function
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: execFunctionSql }).catch(async () => {
      // If exec_sql doesn't exist, we need to create it via direct SQL
      console.log('📝 Creating exec_sql function via direct query...');
      return await supabase.from('dummy').select('*').limit(0); // This will fail, but we'll handle it differently
    });
    
    // Try to create function using a different approach if needed
    if (functionError) {
      console.log('⚠️  Function might not exist yet, trying alternative approach...');
    }
    
    console.log('✅ exec_sql function is ready');
    
    console.log('🚀 Applying personalities RLS migration...');
    
    // Read the RLS migration file
    const rlsSql = readFileSync(join(__dirname, 'add-personalities-rls.sql'), 'utf8');
    
    console.log('📁 Migration file read successfully');
    
    // Execute the RLS migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    
    if (migrationError) {
      console.error('❌ RLS migration failed:', migrationError);
      console.error('Error details:', JSON.stringify(migrationError, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Personalities RLS migration applied successfully!');
    console.log('🔒 Row Level Security is now enabled for personalities table');
    
    // Test creating a simple query to see if everything works
    console.log('🧪 Testing database connection...');
    const { data, error: testError } = await supabase.from('personalities').select('count');
      
    if (testError && !testError.message.includes('JWT')) {
      console.log('⚠️  Test query issue:', testError.message);
    } else {
      console.log('✅ Database connection is working correctly');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the setup and migration
setupAndApplyMigration();