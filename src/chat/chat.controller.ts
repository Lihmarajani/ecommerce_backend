import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // --- NEW: GET INBOX ---
  @Get()
  async getInbox(@Request() req) {
    // Ensure 'req.user.id' matches the property name provided by your JwtStrategy
    return this.chatService.getMyConversations(req.user.id);
  }

  @Post('conversation')
  async getConversation(
    @Body() body: { productId: string; vendorId: string },
    @Request() req
  ) {
    return this.chatService.getOrCreateConversation(body.productId, req.user.id, body.vendorId);
  }

  @Post('message')
  async sendMessage(
    @Body() body: { conversationId: string; content: string }, 
    @Request() req
  ) {
    return this.chatService.sendMessage(body.conversationId, req.user.id, body.content);
  }
}
