// Netlify serverless function to extract deal info from DD report using Claude

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API key not configured' }) 
    };
  }

  try {
    const { pdfText } = JSON.parse(event.body);
    
    if (!pdfText || pdfText.trim().length < 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'PDF text too short or empty. Please ensure the PDF contains readable text.' })
      };
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are analyzing a Due Diligence (DD) report for a venture capital investment opportunity. Extract the following information and return it as JSON only (no other text):

{
  "company_name": "The company name",
  "website_url": "Company website URL if mentioned, or empty string",
  "sector": "Industry sector (e.g., Deep Tech, Healthcare, FinTech, Climate, AI/ML, Consumer, Enterprise)",
  "stage": "Funding stage (e.g., Seed, Series A, Series B, Series C, Growth)",
  "description": "A 2-3 sentence summary of what the company does and the investment opportunity"
}

If you cannot determine a field with confidence, use an empty string for that field.

Here is the DD report text:

${pdfText.substring(0, 15000)}` // Limit text to ~15k chars to stay within context
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to analyze document' })
      };
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    // Parse JSON from Claude's response
    let extracted;
    try {
      // Find JSON in response (Claude sometimes adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to parse extracted data' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          company_name: extracted.company_name || '',
          website_url: extracted.website_url || '',
          sector: extracted.sector || '',
          stage: extracted.stage || '',
          description: extracted.description || ''
        }
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error processing document' })
    };
  }
}
