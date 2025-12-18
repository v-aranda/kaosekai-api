-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password" VARCHAR(255) NOT NULL,
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Desconhecido',
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_access_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'api_token',
    "abilities" TEXT,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "personal_access_tokens_token_key" ON "personal_access_tokens"("token");

-- CreateIndex
CREATE INDEX "personal_access_tokens_expires_at_idx" ON "personal_access_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
