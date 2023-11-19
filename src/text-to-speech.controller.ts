import { Controller, Post, Body, Res } from '@nestjs/common';
import { TextToSpeechService } from './text-to-speech.service';
import { Response } from 'express';
import { ChatService } from './gpt.service';

@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(
    private readonly textToSpeechService: TextToSpeechService,
    private readonly chatService: ChatService,
  ) {}

  @Post('synthesize')
  async synthesize(@Body('text') text: string, @Res() res: Response) {
    try {
      const gptResponse = await this.chatService.chatWithGPT(text);
      const request = {
        input: { text: gptResponse },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-wavenet-F',
          ssmlGender: 'FEMALE',
        },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const audioContent =
        await this.textToSpeechService.synthesizeSpeech(request);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.end(audioContent);
    } catch (error) {
      console.error(error);
      res.status(500).send('Something went wrong while synthesizing speech');
    }
  }
}
// this is the end of the file
