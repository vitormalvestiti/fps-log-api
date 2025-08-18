import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GenerateMatchRankingUseCase } from '../../../application/use-cases/generate-match-ranking.use-case';
import { AssignTeamsUseCase } from '../../../application/use-cases/assign-teams.use-case';
import { AssignTeamsDto } from './dto/assign-teams.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
    constructor(
        private readonly rankingUC: GenerateMatchRankingUseCase,
        private readonly assignTeamsUC: AssignTeamsUseCase,
    ) { }

    @Get(':id/ranking')
    @ApiOperation({ summary: 'Ranking da partida' })
    @ApiParam({ name: 'id', required: true, description: 'ID da partida', example: '11348965' })
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
                        matchId: { type: 'string', example: '11348965' },
                        winner: {
                            oneOf: [
                                {
                                    type: 'object',
                                    properties: {
                                        player: { type: 'string', example: 'Roman' },
                                        favoriteWeapon: { type: 'string', example: 'M16' },
                                    },
                                    required: ['player', 'favoriteWeapon'],
                                },
                                { type: 'null' },
                            ],
                        },
                        ranking: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    player: { type: 'string', example: 'Roman' },
                                    frags: { type: 'integer', example: 12 },
                                    deaths: { type: 'integer', example: 5 },
                                    maxStreak: { type: 'integer', example: 5 },
                                    awards: {
                                        type: 'object',
                                        properties: {
                                            invincible: { type: 'boolean', example: false },
                                            fiveInOneMinute: { type: 'boolean', example: false },
                                        },
                                        required: ['invincible', 'fiveInOneMinute'],
                                    },
                                },
                                required: ['player', 'frags', 'deaths', 'maxStreak', 'awards'],
                            },
                        },
                    },
                    required: ['matchId', 'ranking'],
                },
            },
            required: ['success', 'data'],
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Partida não encontrada',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                statusCode: { type: 'integer', example: 404 },
                path: { type: 'string', example: '/matches/11348965/ranking' },
                error: { type: 'string', example: 'Match not found' },
                timestamp: { type: 'string', format: 'date-time' },
            },
            required: ['success', 'statusCode', 'path', 'error', 'timestamp'],
        },
    })
    async ranking(@Param('id') id: string) {
        return this.rankingUC.execute({ matchId: id });
    }

    @Post(':id/teams')
    @ApiOperation({ summary: 'Atribui times a jogadores de uma partida' })
    @ApiParam({ name: 'id', required: true, description: 'ID da partida', example: '11348965' })
    @ApiBody({
        description: 'Lista de atribuições player → team',
        type: AssignTeamsDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Times atribuídos',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        matchId: { type: 'string', example: '11348965' },
                        assigned: { type: 'integer', example: 2 },
                    },
                    required: ['matchId', 'assigned'],
                },
            },
            required: ['success', 'data'],
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Erro de validação',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                statusCode: { type: 'integer', example: 400 },
                path: { type: 'string', example: '/matches/11348965/teams' },
                error: { type: 'string', example: 'Validation failed' },
                timestamp: { type: 'string', format: 'date-time' },
            },
            required: ['success', 'statusCode', 'path', 'error', 'timestamp'],
        },
    })
    async assign(@Param('id') id: string, @Body() body: AssignTeamsDto) {
        return this.assignTeamsUC.execute({ matchId: id, assignments: body.assignments });
    }
}
