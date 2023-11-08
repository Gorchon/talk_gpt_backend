import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 8082); //here we are telling the app to listen on port 3000 or whatever is in the .env file
  console.log(`Server is running on port ${process.env.PORT || 8082}`);
}
bootstrap();
