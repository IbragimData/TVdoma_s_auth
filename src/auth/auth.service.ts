import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { loginDto, signupDto } from './dto';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { compareSync } from 'bcrypt';
import { addMonths } from 'date-fns';
import { sign } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService:PrismaService,
        private readonly httpService:HttpService,
        private readonly jwtService:JwtService
    ){}

    async signup(dto: signupDto){
        try{ 
            const res = await this.httpService.post("http://localhost:5002/api/user/", {...dto}).toPromise()
            return res.data
        }catch(e){
            console.log(e)
            if(e.response){
                throw new HttpException(e.response.data.message, e.response.data.statusCode)
            }
            throw new HttpException("server error auth", 500)
        }   
    }  

    async login(dto:loginDto){
        try{
            const res = await this.httpService.get("http://localhost:5002/api/user/" + dto.mail).toPromise()
            if(!res.data){
                throw new BadRequestException()
            }
            const validPassword = compareSync(dto.password, res.data.password)
            if(!validPassword){
                throw  new BadRequestException()
            }
            const jwtToken = await this.getJwtToken(res.data.id)
            const token = await this.prismaService.token.create({
                data: {
                    jwt: jwtToken,
                    createData: new Date(),
                    exp: addMonths(new Date(), 1),
                    userId: res.data.id
                }
            })
            return token
        }catch(e){
            console.log(e)
            if(e.response){
                throw new HttpException(e.response.message, e.response.statusCode)
            }
            throw new HttpException("server error auth", 500)
        }
    }

    private async getJwtToken(id:string){
        return this.jwtService.sign({
            id,
        })
    }
}
