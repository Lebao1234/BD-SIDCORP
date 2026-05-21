import bcrypt from 'bcryptjs';
import { prisma } from './db';

// seedDemoUsers: disabled for production use – real accounts should be created via the /auth/register endpoint.
export const seedDemoUsers = async () => {
  console.log('>>> seedDemoUsers disabled – no demo users will be created.');
};
