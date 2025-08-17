import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GenerateMatchRankingUseCase } from '../../../application/use-cases/generate-match-ranking.use-case';
import { AssignTeamsUseCase } from '../../../application/use-cases/assign-teams.use-case';
import { AssignTeamsDto } from './dto/assign-teams.dto';


@Controller('matches')
export class MatchesController {
    constructor(
        private readonly rankingUC: GenerateMatchRankingUseCase,
        private readonly assignTeamsUC: AssignTeamsUseCase,
    ) { }

    @Get(':id/ranking')
    async ranking(@Param('id') id: string) {
        return this.rankingUC.execute({ matchId: id });
    }

    @Post(':id/teams')
    async assign(@Param('id') id: string, @Body() body: AssignTeamsDto) {
        return this.assignTeamsUC.execute({ matchId: id, assignments: body.assignments });
    }
}
