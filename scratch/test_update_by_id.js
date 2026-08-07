import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseKey = 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'completed'
    })
    .eq('id', '7dd5c560-e0ea-4aee-9ef2-241981b5c671')
    .select();

  console.log("Update by UUID result:", data, error);
}

testUpdate();
