// gpt.controller.ts
import { Controller, Post } from '@nestjs/common';
import { ChatService } from './gpt.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async talkToGPT(): Promise<string> {
    return this.chatService.chatWithGPT();
  }
}
