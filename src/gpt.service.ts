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

    // Initialize Firebase Admin SDK for emotional data
    const emotionsServiceAccount = require('/Users/chema./Downloads/programming/talk-gpt-backend/firebaseKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(emotionsServiceAccount),
      databaseURL: 'https://iot-project-cows-default-rtdb.firebaseio.com/',
    });

    // Initialize Firebase Admin SDK for cardiac data
    const cardiacServiceAccount = require('/Users/chema./Downloads/programming/talk-gpt-backend/bitsKey.json');
    const cardiacApp = admin.initializeApp({
      credential: admin.credential.cert(cardiacServiceAccount),
      databaseURL: 'https://car-control-9599f-default-rtdb.firebaseio.com/',
    }, 'cardiacRhythm'); // Use an alias to distinguish between databases
  }

  async getLatestEmotionAndName(): Promise<{ emotion: string | null; name: string | null }> {
    // Use the 'emotions' database instance
    const emotionsSnapshot = await admin
      .database()
      .ref('emotions')
      .orderByKey()
      .limitToLast(1)
      .once('value');

    const emotions = emotionsSnapshot.val();
    const emotionData = emotions ? emotions[Object.keys(emotions)[0]].emotion : null;
    const nameData = emotions ? emotions[Object.keys(emotions)[0]].name : null;

    return { emotion: emotionData, name: nameData };
  }

  async getLatestCardiacData(): Promise<{ bpm: number | null }> {
    // Use the 'cardiacRhythm' database instance directly
    const cardiacSnapshot = await admin
      .app('cardiacRhythm')
      .database()
      .ref('BPM')
      .orderByKey()
      .limitToLast(1)
      .once('value');

    const bpmData = cardiacSnapshot.val();
    // Extract relevant data and return it
    return { bpm: bpmData };
  }

  async chatWithGPT(content: string): Promise<string> {
    const { emotion, name } = await this.getLatestEmotionAndName();
    const { bpm } = await this.getLatestCardiacData();

    // Add user's input, emotional context, and name to the conversation history
    this.conversationHistory.push({
      role: 'user',
      content: `${content} I am feeling ${emotion} my name is ${name} and my heart rate is ${bpm} Beats per minute.`,
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
