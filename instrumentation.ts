export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 App running at: http://localhost:3000');
  }
}
