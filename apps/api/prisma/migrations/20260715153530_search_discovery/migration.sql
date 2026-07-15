-- CreateTable
CREATE TABLE "SearchQueryStat" (
    "id" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "displayQuery" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchQueryStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentlyViewedService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecentlyViewedService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchQueryStat_normalizedQuery_key" ON "SearchQueryStat"("normalizedQuery");

-- CreateIndex
CREATE INDEX "SearchQueryStat_count_idx" ON "SearchQueryStat"("count");

-- CreateIndex
CREATE INDEX "SearchQueryStat_lastSearchedAt_idx" ON "SearchQueryStat"("lastSearchedAt");

-- CreateIndex
CREATE INDEX "RecentlyViewedService_userId_viewedAt_idx" ON "RecentlyViewedService"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "RecentlyViewedService_serviceId_idx" ON "RecentlyViewedService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecentlyViewedService_userId_serviceId_key" ON "RecentlyViewedService"("userId", "serviceId");

-- AddForeignKey
ALTER TABLE "RecentlyViewedService" ADD CONSTRAINT "RecentlyViewedService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentlyViewedService" ADD CONSTRAINT "RecentlyViewedService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
