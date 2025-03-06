import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateMarkdownDto } from './dto/create-markdown.dto';
import { MarkdownService } from './markdown.service';

@Controller('markdown')
export class MarkdownController {
  constructor(private readonly markdownService: MarkdownService) {}

  @Post()
  create(@Body() createMarkdownDto: CreateMarkdownDto) {
    try {
      const html = this.markdownService.convertToHtml(
        createMarkdownDto.markdown,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Markdown converted successfully',
        html: html,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as Error;
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
          error: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
