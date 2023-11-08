import { Injectable } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
@Injectable()
export class TextToSpeechService {
  private client: TextToSpeechClient;

  constructor() {
    this.client = new TextToSpeechClient();
  }
  async synthesizeSpeech(requestBody) {
    const [response] = await this.client.synthesizeSpeech(requestBody);
    return response.audioContent;
  }
}
