import { SlackAPIClient } from 'npm:slack-web-api-client@0.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const slackToken = Deno.env.get('SLACK_TOKEN');
    if (!slackToken) {
      throw new Error('Slack token is not configured');
    }

    const { channel, message } = await req.json();
    
    if (!channel || !message) {
      throw new Error('Channel and message are required');
    }

    const slackClient = new SlackAPIClient(slackToken);
    
    await slackClient.chat.postMessage({
      channel,
      text: message,
      mrkdwn: true
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});