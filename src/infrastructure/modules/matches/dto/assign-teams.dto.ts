import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';

export class AssignTeamsDto {
    @ApiProperty({ example: '11348965' })
    @IsString() @MinLength(1)
    matchId!: string;

    @ApiProperty({
        isArray: true,
        example: [
            { playerName: 'Alice', teamName: 'Red' },
            { playerName: 'Bob', teamName: 'Blue' },
        ],
    })
    @IsArray() @ArrayNotEmpty()
    assignments!: Array<{ playerName: string; teamName: string }>;
}
