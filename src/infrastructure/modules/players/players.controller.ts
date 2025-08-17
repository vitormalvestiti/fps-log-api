import { Controller, Get, Query } from '@nestjs/common';
import { ComputeGlobalRankingUseCase } from '../../../application/use-cases/compute-global-ranking.use-case';

@Controller('players')
export class PlayersController {
  constructor(private readonly globalUC: ComputeGlobalRankingUseCase) {}

  @Get('global-ranking')
  async global(@Query() q: any) {
    return this.globalUC.execute({ limit: q.limit, offset: q.offset });
  }
}