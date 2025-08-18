import { Injectable } from '@nestjs/common';
import { parseLog } from '../../core/log/parse-log';
import { ParseResult } from '../../core/log/types';

@Injectable()
export class LogParserService {
    parse(rawLog: string): ParseResult {
        return parseLog(rawLog);
    }
}
