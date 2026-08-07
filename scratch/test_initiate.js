async function testApiInitiate() {
  const res = await fetch('http://localhost:3000/api/paytm/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ground_id: 1,
      total_amount: 1200,
      booking_id: 'TEST_ORD_' + Date.now(),
      customer_details: {
        customer_id: 'CUST_101',
        customer_phone: '9876543210',
        customer_email: 'test@example.com'
      }
    })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('API Response:', JSON.stringify(data, null, 2));
}

testApiInitiate();
