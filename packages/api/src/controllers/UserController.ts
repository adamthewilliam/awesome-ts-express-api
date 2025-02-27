import { JsonController, Get, Post, Body, Param, Authorized } from 'routing-controllers';
import { Inject } from 'typedi';
import { UserService } from '../services/UserService.ts';
import { User } from '../entities/User.ts';
import { CreateUserDto } from '../dtos/CreateUserDto';

@JsonController('/users')
export class UserController {
    @Inject()
    private userService: UserService;

    @Get()
    @Authorized()
    async getAllUsers(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Get('/:id')
    @Authorized()
    async getOneUser(@Param('id') id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @Post()
    async createUser(@Body() userData: CreateUserDto): Promise<User> {
        return this.userService.create(userData);
    }
}