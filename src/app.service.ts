import { Injectable } from '@nestjs/common';

interface ApiResponse {
  success: boolean;
  message: string;
}


@Injectable()
export class AppService {

  getHello(): string {
    return "hello trilok";
  }
}
