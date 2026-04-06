exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, table, data, token, id } = JSON.parse(event.body);
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    };

    if (action === 'getAll') {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?order=created_at.desc`,
        { headers }
      );
      const result = await response.json();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    if (action === 'insert') {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}`,
        { method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' }, body: JSON.stringify(data) }
      );
      const result = await response.json();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    if (action === 'delete') {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
        { method: 'DELETE', headers }
      );
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 400, body: 'Unknown action' };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};
