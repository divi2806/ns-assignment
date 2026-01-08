import postgres from 'postgres';
const sql = postgres("postgresql://neondb_owner:npg_vTjaBe43XOgq@ep-shy-grass-ady7hd2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require", { ssl: 'require', max: 1 });
const r = await sql`DELETE FROM activity_cache`;
console.log('✅ Cleared', r.length, 'cache entries');
await sql.end();

