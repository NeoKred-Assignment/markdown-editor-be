import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMarkdownDto {
  @ApiProperty({
    description: 'The markdown content to be converted to HTML',
    example: '# Hello World\nThis is a markdown example.',
  })
  @IsString()
  @IsNotEmpty()
  markdown: string;
}
