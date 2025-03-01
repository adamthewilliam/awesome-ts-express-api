import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'Name is required' })
    name!: string;

    @IsEmail({}, { message: 'Email must be valid' })
    email!: string;

    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password!: string;

    @IsOptional()
    @IsInt()
    @Min(18)
    age?: number;

    isActive?: boolean = true;

    updatedAt?: Date;
}