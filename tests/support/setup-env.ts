// Integration tests talk to a real Postgres database (study_party_test by default).
process.env.DATABASE_URL ??= "postgres://localhost:5432/study_party_test";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3100";
process.env.LIVEKIT_API_KEY ??= "devkey";
process.env.LIVEKIT_API_SECRET ??= "secret";
process.env.LIVEKIT_URL ??= "http://localhost:7880";
process.env.NEXT_PUBLIC_LIVEKIT_URL ??= "ws://localhost:7880";
