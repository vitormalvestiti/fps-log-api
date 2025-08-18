# FPS Log API

API em NestJS para receber logs de partidas de FPS, parsear eventos, armazenar em PostgreSQL e expor rankings e estatísticas. Inclui um painel estático simples e documentação Swagger.

## Tecnologias e arquitetura
- **NestJS 11** com **TypeScript**
- **TypeORM** com **PostgreSQL**
- **class-validator** e **class-transformer** para validação e transformação
- **Multer** para upload de arquivos
- **Swagger** em `/docs`
- Padrões **DDD** por camadas
  - `domain` entidades e value objects
  - `application` casos de uso, serviços e DTOs
  - `infrastructure` repositórios, módulos Nest, ORM
  - `core` regras puras de parsing e cálculo

## Pré‑requisitos
- **Node.js 18 ou 20** e **npm**
- **PostgreSQL 13+**
- Acesso a um banco local com usuário que possa criar tabelas

## Variáveis de ambiente
Arquivo `.env` de exemplo já incluso:
```
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASS=010203
DB_NAME=fps_log_db
DB_SYNC=false
DB_LOGGING=true
```
## Instalação e execução
```bash
# 1) instalar dependências
npm install

# 2) criar o banco vazio no PostgreSQL
# psql -U postgres -c "CREATE DATABASE fps_log_db;"

# 3) aplicar migrações
npm run migration:run
# equivale a: npx ts-node -r dotenv/config ./scripts/migrate.ts run

# 4) rodar em desenvolvimento
npm run start:dev

```
Endpoints úteis
- Swagger: `http://localhost:3000/docs`
- Painel para consumo da API: `http://localhost:3000/painel`

## Banco de dados e migrações
Scripts disponíveis
```jsonc
"scripts": {
  "migration:run": "ts-node -r dotenv/config ./scripts/migrate.ts run",
  "migration:revert": "ts-node -r dotenv/config ./scripts/migrate.ts revert"
}
```
- As entidades ficam em `src/infrastructure/database/orm`.
- Migrações ficam em `src/infrastructure/database/migrations`.

## Formato de respostas
Padrão do interceptor:
```json
{ "success": true, "data": { /* payload */ } }
```
Erros tratados por filtro global:
```json
{
  "success": false,
  "statusCode": 400,
  "path": "/rota",
  "error": "mensagem de erro",
  "timestamp": "2025-08-17T12:00:00.000Z"
}
```

## Rotas da API

### 1) `POST /upload`
Envia um log para processamento. Duas formas

A) **JSON** com o conteúdo do log

B) **Arquivo** .TXT ou .LOG

### 2) `GET /matches/{id}/ranking`
Gera ranking da partida informada.

### 3) `POST /matches/{id}/teams`
Atribui times a jogadores de uma partida.

### 4) `GET /players/global-ranking`
Ranking global consolidado por jogador, com paginação.

## Lógica de domínio e regras
### Formato do log aceito
Linhas no padrão
- `DD/MM/YYYY HH:mm:ss - New match {id} has started`
- `{data} - {killer} killed {victim} using {WEAPON}`
- `{data} - <WORLD> killed {victim} by {REASON}`
- `DD/MM/YYYY HH:mm:ss - Match {id} has ended`


### Estatísticas por partida
- `frags` e `deaths` por jogador
- `maxStreak` sequência máxima de abates
- `winner` jogador com mais frags. Empates desempate por menos deaths depois por maior `maxStreak`
- **Prêmios**
  - `invincible` quando o vencedor termina com zero mortes
  - `fiveInOneMinute` quando um jogador realiza 5 abates em uma janela de 60 segundos
- Abates do `<WORLD>` contam apenas como morte
- Team kill depende das atribuições de time da partida

### Ranking global
Agrega estatísticas em todas as partidas
- `totalFrags`, `totalDeaths` e `kd` calculado
- `wins` quantidade de partidas vencidas
- `bestStreak` melhor sequência em qualquer partida
- Ordenação por `totalFrags` desc, depois `kd` desc, depois `wins` desc, depois `bestStreak` desc

 Scripts NPM e testes
Principais scripts
```jsonc
"start": "nest start",
"start:dev": "nest start --watch",
"build": "nest build",
"test": "jest",
"test:watch": "jest --watch",
"test:e2e": "jest --config ./test/jest-e2e.json",
"migration:run": "ts-node -r dotenv/config ./scripts/migrate.ts run",
"migration:revert": "ts-node -r dotenv/config ./scripts/migrate.ts revert"
```
## Rodar testes

npm run test

## Rodar API
npm run start:dev

## Documentação
- Swagger em `http://localhost:3000/docs` com schemas e exemplos

