import { Controller, Get, Query } from '@nestjs/common';
import { ComputeGlobalRankingUseCase } from '../../../application/use-cases/compute-global-ranking.use-case';
import { GlobalRankingQueryDto } from './dto/global-ranking.query.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly globalUC: ComputeGlobalRankingUseCase) { }

  @Get('global-ranking')
  @ApiOperation({ summary: 'Ranking global de jogadores (paginado)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, minimum: 0, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 2 },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  player: { type: 'string', example: 'Roman' },
                  totalFrags: { type: 'integer', example: 12 },
                  totalDeaths: { type: 'integer', example: 5 },
                  kd: { type: 'number', example: 2.4 },
                  wins: { type: 'integer', example: 1 },
                  bestStreak: { type: 'integer', example: 5 },
                },
                required: ['player', 'totalFrags', 'totalDeaths', 'kd', 'wins', 'bestStreak'],
              },
            },
          },
          required: ['total', 'items'],
        },
      },
      required: ['success', 'data'],
    },
  })
  async global(@Query() q: GlobalRankingQueryDto) {
    return this.globalUC.execute({ limit: q.limit, offset: q.offset });
  }
}