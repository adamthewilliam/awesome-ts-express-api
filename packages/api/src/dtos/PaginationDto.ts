import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value ? decodeURIComponent(value) : undefined)
    cursor?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => parseInt(value) || 20)
    limit: number = 20;

    timestamp: Date = new Date();
}