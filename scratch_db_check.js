const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTeams() {
  console.log("Trying to insert into teams with only name...");
  const { data, error } = await supabase
    .from('teams')
    .insert([{ name: 'Test Team' }])
    .select();
    
  if (error) {
    console.error("Teams insert error:", error);
  } else {
    console.log("Teams insert success! Columns are:", Object.keys(data[0]));
    await supabase.from('teams').delete().eq('id', data[0].id);
  }
}

checkTeams();
