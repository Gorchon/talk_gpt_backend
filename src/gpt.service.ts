import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private conversationHistory: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chatWithGPT(content: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content,
    });

    const chatCompletion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...this.conversationHistory,
      ],
      model: 'gpt-3.5-turbo',
    });

    this.conversationHistory.push({
      role: 'assistant',
      content: chatCompletion.choices[0].message.content,
    });

    return chatCompletion.choices[0].message.content;
  }
}
