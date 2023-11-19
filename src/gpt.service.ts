import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

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

    // Initialize Firebase Admin SDK
    const serviceAccount = require('/Users/chema./Downloads/programming/talk-gpt-backend/firebaseKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://iot-project-cows-default-rtdb.firebaseio.com/',
    });
  }

  async getLatestEmotionAndName(): Promise<{ emotion: string | null; name: string | null }> {
    // Get the most recent entry from the emotions collection
    const emotionsSnapshot = await admin
      .database()
      .ref('emotions')
      .orderByKey()
      .limitToLast(1)
      .once('value');

    const emotions = emotionsSnapshot.val();
    const emotionData = emotions ? emotions[Object.keys(emotions)[0]].emotion : null;

    // Assuming there is a 'name' field in your Firebase data
    const nameData = emotions ? emotions[Object.keys(emotions)[0]].name : null;

    return { emotion: emotionData, name: nameData };
  }

  async chatWithGPT(content: string): Promise<string> {
    const { emotion, name } = await this.getLatestEmotionAndName();

    // Add user's input, emotional context, and name to the conversation history
    this.conversationHistory.push({
      role: 'user',
      content: `${content} I am feeling ${emotion} my name is ${name}.`,
    });

    const chatCompletion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...this.conversationHistory,
      ],
      model: 'gpt-3.5-turbo',
    });

    // Add the assistant's reply to the conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: chatCompletion.choices[0].message.content,
    });

    // Return the assistant's reply
    return chatCompletion.choices[0].message.content;
  }
}
