-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "creationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "nftId" TEXT,
    "hcsTopicId" TEXT,
    "hcsSequenceNumber" BIGINT,
    "ipfsMetadataCid" TEXT,
    "farmerAccountId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_nftId_key" ON "Batch"("nftId");

-- CreateIndex
CREATE INDEX "Batch_farmerAccountId_idx" ON "Batch"("farmerAccountId");
