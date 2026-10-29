import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ModelsModule } from './models/models.module.js';
import { FilesModule } from './files/files.module.js';
import { VectorModule } from './vector/vector.module.js';
import { AgentEngineModule } from './agent-engine/agent-engine.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [AuthModule, UsersModule, ConversationsModule, ChatModule, ModelsModule, FilesModule, VectorModule, AgentEngineModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
