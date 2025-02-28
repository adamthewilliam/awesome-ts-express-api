import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { User } from '../entities/User.js';
import { PaginationDto } from '../dtos/PaginationDto.js';

interface PaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
    count: number;
}

interface CursorData {
    timestamp: Date;
    id: number;
}

@Service()
export class UserRepository {
    constructor(
        private baseRepository: Repository<User>,
    ) {}

    async findWithPagination(params: PaginationDto): Promise<PaginatedResult<User>> {
        const { cursor, limit = 20, timestamp } = params;
        const effectiveLimit = Math.min(limit, 100);

        const queryBuilder = this.baseRepository.createQueryBuilder('user');

        if (cursor) {
            try {
                const cursorData = this.decodeCursor(cursor);
                queryBuilder.where('user.createdAt < :timestamp OR (user.createdAt = :timestamp AND user.id < :id)', {
                    timestamp: cursorData.timestamp,
                    id: cursorData.id
                });
            } catch (error) {
                throw new Error('Invalid cursor format');
            }
        } else if (timestamp) {
            queryBuilder.where('user.createdAt < :timestamp', {
                timestamp
            });
        }

        queryBuilder
            .orderBy('user.createdAt', 'DESC')
            .addOrderBy('user.id', 'DESC')
            .take(effectiveLimit + 1);

        const users = await queryBuilder.getMany();

        const hasMore = users.length > effectiveLimit;
        if (hasMore) {
            users.pop();
        }

        // Generate next cursor
        let nextCursor = null;
        if (hasMore && users.length > 0) {
            const lastItem = users.at(-1);
            if (lastItem) {
                nextCursor = this.encodeCursor({
                    timestamp: lastItem.createdAt,
                    id: lastItem.id
                });
            }
        }

        return {
            items: users,
            nextCursor,
            count: users.length
        };
    }

    async findById(id: string | number): Promise<User | null> {
        return this.baseRepository.findOneBy({ id: Number(id) });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.baseRepository.create(userData);
        return this.baseRepository.save(user);
    }

    async update(id: number, userData: Partial<User>): Promise<User | null> {
        await this.baseRepository.update(id, userData);
        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.baseRepository.delete(id);
        return result.affected !== 0;
    }

    private encodeCursor(data: CursorData): string {
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }

    private decodeCursor(cursor: string): CursorData {
        const data = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        return {
            timestamp: new Date(data.timestamp),
            id: Number(data.id)
        };
    }
}