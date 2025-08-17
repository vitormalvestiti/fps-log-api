import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UploadLogDto {
  @ApiProperty({ required: false, description: 'Conteúdo do log, quando não enviar arquivo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}