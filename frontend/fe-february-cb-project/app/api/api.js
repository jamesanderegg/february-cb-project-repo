const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

console.log(API_BASE_URL)
export async function getFlaskData() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch data from Flask API');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Flask data:', error);
    return { error: error.message };
  }
}
