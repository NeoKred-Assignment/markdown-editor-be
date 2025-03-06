import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Prabakaran! This is a test message testing the docker container test';
  }
}
