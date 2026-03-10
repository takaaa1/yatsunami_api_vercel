-- CreateTable
CREATE TABLE "legacy_password_hash" (
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_password_hash_pkey" PRIMARY KEY ("email")
);
