// chat.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
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

    // Initialize Firebase Admin SDK
    const serviceAccount = require('/Users/chema./Downloads/programming/talk-gpt-backend/firebaseKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://iot-project-cows-default-rtdb.firebaseio.com/',
    });
  }

  async chatWithGPT(): Promise<string> {
    // Get the most recent entry from the emotions collection
    const snapshot = await admin
      .database()
      .ref('emotions')
      .orderByKey()
      .limitToLast(1) // this is the most recent entry in the database (last one), if we want to put the first one we should use limitToFirst(1)
      .once('value');
    const latestEntry = snapshot.val();

    if (!latestEntry) {
      throw new Error('No emotions data found.');
    }

    const { name, emotion } = latestEntry[Object.keys(latestEntry)[0]];

    this.conversationHistory.push({
      role: 'user',
      content: `User named ${name} is feeling ${emotion}.`,
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
