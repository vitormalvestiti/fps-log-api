import { Controller, Get, Query } from '@nestjs/common';
import { ComputeGlobalRankingUseCase } from '../../../application/use-cases/compute-global-ranking.use-case';
import { GlobalRankingQueryDto } from './dto/global-ranking.query.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly globalUC: ComputeGlobalRankingUseCase) {}

  @Get('global-ranking')
  async global(@Query() q: GlobalRankingQueryDto) {
    return this.globalUC.execute({ limit: q.limit, offset: q.offset });
  }
}