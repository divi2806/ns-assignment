import postgres from 'postgres';

const sql = postgres("postgresql://neondb_owner:npg_vTjaBe43XOgq@ep-shy-grass-ady7hd2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require", { ssl: 'require', max: 1 });

try {
  const result = await sql`DELETE FROM activity_cache WHERE address = '0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5' RETURNING address`;
  console.log(`✅ Deleted ${result.length} entries for nick.eth`);
} catch (e) {
  console.error(e);
} finally {
  await sql.end();
}

