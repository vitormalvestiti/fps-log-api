import { BadRequestException, Body, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseLogUseCase } from '../../../application/use-cases/parse-log.use-case';
import { UploadLogDto } from './dto/upload-file.dto';

import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiTags('Upload')
@ApiExtraModels(UploadLogDto)
@Controller('upload')
export class UploadController {
  constructor(private readonly parseLog: ParseLogUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Envia o conteúdo do log como JSON ou texto puro' })
  @ApiConsumes('application/json', 'text/plain')
  @ApiBody({
    description: 'Envie JSON { content } OU text/plain com o log bruto',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UploadLogDto) },
        { type: 'string', description: 'Conteúdo do log em text/plain' },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: { matchId: { type: 'string', example: '11348965' } },
                required: ['matchId'],
              },
            },
          },
          required: ['matches'],
        },
      },
      required: ['success', 'data'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação / log vazio',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'integer', example: 400 },
        path: { type: 'string', example: '/upload' },
        error: { type: 'string', example: 'Empty log content' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['success', 'statusCode', 'path', 'error', 'timestamp'],
    },
  })
  async uploadJsonOrText(@Req() req: Request, @Body() body: UploadLogDto) {
    console.log('REQ METHOD:', req.method);
    console.log('REQ URL:', req.url);
    console.log('HEADERS:', req.headers);
    console.log('BODY RAW (as seen by Nest):', body);

    const raw = typeof body === 'string' ? body : body?.content;
    const log = (raw ?? '').trim();
    if (!log) throw new BadRequestException('Empty log content');

    return this.parseLog.execute({ log });
  }

  @Post('file')
  @ApiOperation({ summary: 'Envia um arquivo de log (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: { matchId: { type: 'string', example: '11348965' } },
                required: ['matchId'],
              },
            },
          },
          required: ['matches'],
        },
      },
      required: ['success', 'data'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação / log vazio',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'integer', example: 400 },
        path: { type: 'string', example: '/upload/file' },
        error: { type: 'string', example: 'Empty log content' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['success', 'statusCode', 'path', 'error', 'timestamp'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
   async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const log = file.buffer?.toString('utf8')?.trim() ?? '';
    if (!log) throw new BadRequestException('Empty log content');

    return this.parseLog.execute({ log });
  }
}
