import {Inject, Service} from 'typedi';
import { User } from '../entity/User.js';
import { CreateUserDto } from '../dtos/CreateUserDto.js';
import { NotFoundError } from 'routing-controllers';
import { type PaginationDto } from "../dtos/PaginationDto.js";
import { UserRepository } from "../repositories/UserRepository.js";
import {hashPassword} from "../utils/crypto.js";

@Service()
export class UserService {
    constructor(
        @Inject()
        private userRepository: UserRepository
    ) {}

    async findAll(pagingOptions: PaginationDto) {
        return this.userRepository.findWithPagination(pagingOptions);
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }
        return user;
    }

    async create(userData: CreateUserDto): Promise<User> {
        const hashedPassword = await hashPassword(userData.password);

        return this.userRepository.create({
            ...userData,
            password: hashedPassword
        });
    }
}