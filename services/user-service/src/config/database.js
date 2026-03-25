const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Connect to the PostgreSQL database via Prisma.
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connected via Prisma');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };