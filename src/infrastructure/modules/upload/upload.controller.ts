import { BadRequestException, Body, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseLogUseCase } from '../../../application/use-cases/parse-log.use-case';
import { UploadLogDto } from './dto/upload-file.dto';


@Controller('upload')
export class UploadController {
  constructor(private readonly parseLog: ParseLogUseCase) {}

  @Post()
async uploadJsonOrText(@Req() req: Request, @Body() body: UploadLogDto) {
    console.log('REQ METHOD:', req.method);
    console.log('REQ URL:', req.url);
    console.log('HEADERS:', req.headers);
    console.log('BODY:', body);

    const raw = typeof body === 'string' ? body : body?.content;
    const log = (raw ?? '').trim();
    if (!log) throw new BadRequestException('Empty log content');

    return this.parseLog.execute({ log });
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    const log = file ? file.buffer.toString('utf8').trim() : '';
    if (!log) throw new BadRequestException('Empty log content');
    return this.parseLog.execute({ log });
  }
}
