import {JsonController, Get, Post, Body, Param, QueryParams} from 'routing-controllers';
import { Inject } from 'typedi';
import { UserService } from '../services/UserService.js';
import { User } from '../entity/User.js';
import { CreateUserDto } from '../dtos/CreateUserDto.js';
import type {PaginationDto} from "../dtos/PaginationDto.js";

@JsonController('/users')
export class UserController {
    constructor(
        @Inject()
        private userService: UserService
    ) {}

    @Get()
    getUsers(@QueryParams() pagingOptions: PaginationDto) {
        return this.userService.findAll(pagingOptions);
    }

    @Get('/:id')
    async getUser(@Param('id') id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @Post()
    async createUser(@Body() userData: CreateUserDto): Promise<User> {
        return this.userService.create(userData);
    }
}