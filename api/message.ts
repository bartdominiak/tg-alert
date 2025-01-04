import type { VercelRequest, VercelResponse } from '@vercel/node';

const sleep = (delay: number) => {
  if (delay <= 0) return;
  new Promise(resolve => setTimeout(resolve, delay));
};

async function tgMessage(message: string, botId: string, chatId: string, replyToMessageId: string, delay = 100) {
  try {
    await sleep(delay);

    const config = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
      ...(replyToMessageId && { reply_to_message_id: replyToMessageId })
    };

    const response = await fetch(`https://api.telegram.org/bot${botId}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Failed to send message');
    }

    return true;
  } catch (error: any) {
    console.error('Error sending message:', error.message);
    return false;
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, botId, chatId, delay, replyToMessageId } = request.body;

    if (!message || !botId || !chatId) {
      return response.status(400).json({
        error: 'Missing required fields',
        required: ['message', 'botId', 'chatId']
      });
    }

    const result = await tgMessage(message, botId, chatId, replyToMessageId, delay);
    if (!result) throw new Error('Failed to send message');

    return response.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    return response.status(500).json({
      error: 'Failed to send message',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
