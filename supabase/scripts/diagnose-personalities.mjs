import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePersonalities() {
  try {
    console.log('🔍 Diagnosing personalities table...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Test 1: Check if we can access personalities table at all
    console.log('\n📋 Test 1: Checking table access...');
    const { data: testData, error: testError } = await supabase
      .from('personalities')
      .select('count');
      
    if (testError) {
      console.error('❌ Cannot access personalities table:', testError);
      if (testError.code === '42P01') {
        console.log('💡 Table does not exist - you need to run migrations first');
      } else if (testError.code === '42501') {
        console.log('💡 RLS policy blocking access - need to enable RLS policies');
      }
      return;
    } else {
      console.log('✅ Table access successful');
    }
    
    // Test 2: Check table structure via information_schema
    console.log('\n📊 Test 2: Checking table columns...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'personalities' 
          ORDER BY ordinal_position
        `
      });
      
    if (columnsError) {
      console.log('⚠️  Cannot check table structure (this is expected if sql function is not available)');
      console.log('Error:', columnsError.message);
    } else {
      console.log('Table columns:', columns);
    }
    
    // Test 3: Try to query existing personalities
    console.log('\n📝 Test 3: Querying existing personalities...');
    const { data: personalities, error: queryError } = await supabase
      .from('personalities')
      .select('*')
      .limit(5);
      
    if (queryError) {
      console.error('❌ Cannot query personalities:', queryError);
      console.error('Error details:', {
        code: queryError.code,
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint
      });
    } else {
      console.log('✅ Query successful');
      console.log('Existing personalities:', personalities?.length || 0);
      if (personalities && personalities.length > 0) {
        console.log('Sample personality:', personalities[0]);
      }
    }
    
    // Test 4: Try a simple insert to see what fails
    console.log('\n✏️  Test 4: Testing insert (will be rolled back)...');
    const testPersonality = {
      user_id: '00000000-0000-0000-0000-000000000000', // fake UUID for testing
      name: 'Test Personality',
      prompt: 'Test prompt',
      is_active: false,
      has_memory: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('personalities')
      .insert(testPersonality)
      .select();
      
    if (insertError) {
      console.error('❌ Insert failed (this helps us understand the issue):');
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Common error codes and their meanings
      if (insertError.code === '23502') {
        console.log('💡 This is a NOT NULL constraint violation - missing required field');
      } else if (insertError.code === '42703') {
        console.log('💡 This is a column does not exist error - schema mismatch');
      } else if (insertError.code === '23505') {
        console.log('💡 This is a unique constraint violation');
      } else if (insertError.code === '42501') {
        console.log('💡 This is a permission/RLS policy error');
      }
    } else {
      console.log('✅ Insert successful (unexpected but good!)');
      console.log('Inserted data:', insertData);
      
      // Clean up the test insert
      if (insertData && insertData[0]) {
        await supabase
          .from('personalities')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnosePersonalities();