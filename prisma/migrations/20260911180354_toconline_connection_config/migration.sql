-- AlterTable
ALTER TABLE "ToconlineConnection" ADD COLUMN     "apiBaseUrl" TEXT,
ADD COLUMN     "authState" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "clientSecret" TEXT,
ADD COLUMN     "oauthBaseUrl" TEXT,
ADD COLUMN     "redirectUri" TEXT;
