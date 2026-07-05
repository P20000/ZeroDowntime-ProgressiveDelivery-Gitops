export const config = {
  port: process.env.PORT || 5000,
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fintech',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'fintech',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
