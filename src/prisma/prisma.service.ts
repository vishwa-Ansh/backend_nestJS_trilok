import { Injectable, OnModuleInit } from '@nestjs/common';
import { db } from './db.js';

@Injectable()
export class PrismaService implements OnModuleInit {
    async onModuleInit() {
        try {
            const user = await db.orm.public.User
                .where({})
                .first();

            console.log(
                'PostgreSQL connected successfully'
            );

            console.log(
                'First user:',
                user ?? 'No users found'
            );
        } catch (error) {
            console.error(
                'PostgreSQL connection failed:',
                error
            );

            throw error;
        }
    }

    get client() {
        return db;
    }
}