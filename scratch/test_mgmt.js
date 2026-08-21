const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc2RzamN3bmljamhkc3ptZGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMwNzI0MiwiZXhwIjoyMTAwODgzMjQyfQ.FZF6oZvpNoMyaFKg2oaZFeoIn-AsCYZhami0VBVYL4M';
const ref = 'bmsdsjcwnicjhdszmddw';

async function testApi() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/db/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT 1;' })
  });
  console.log('Status:', res.status, await res.text());
}
testApi();
