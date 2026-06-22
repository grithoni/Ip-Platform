-- CreateTable
CREATE TABLE "ADRAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "disputeType" TEXT NOT NULL,
    "hasPatent" BOOLEAN NOT NULL DEFAULT true,
    "patentNumber" TEXT,
    "bothPartiesKnown" BOOLEAN NOT NULL DEFAULT false,
    "respondentWilling" TEXT,
    "amountInDispute" TEXT,
    "urgencyLevel" TEXT,
    "hasPriorNegotiation" BOOLEAN NOT NULL DEFAULT false,
    "technicalComplexity" TEXT,
    "recommendedPath" TEXT NOT NULL,
    "answers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ADRAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responseText" TEXT,
    "counterclaimDesc" TEXT,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ENEAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "bindingType" TEXT NOT NULL DEFAULT 'NON_BINDING',
    "applicantAgreed" BOOLEAN NOT NULL DEFAULT false,
    "respondentAgreed" BOOLEAN NOT NULL DEFAULT false,
    "bothPartiesAgreed" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT,
    "preliminaryOpinion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ENEAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ENEAssessment_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpertApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "technicalFields" TEXT NOT NULL,
    "qualifications" TEXT,
    "experienceYears" INTEGER,
    "bio" TEXT,
    "hourlyRateExpect" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpertApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpertRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expertId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "dimensions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertRating_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpertRating_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpertRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConflictOfInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expertId" TEXT NOT NULL,
    "partyUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConflictOfInterest_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConflictOfInterest_partyUserId_fkey" FOREIGN KEY ("partyUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "patentNumber" TEXT NOT NULL,
    "patentTitle" TEXT NOT NULL,
    "disputeType" TEXT NOT NULL,
    "amountInDispute" REAL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "applicantId" TEXT NOT NULL,
    "respondentId" TEXT,
    "responseDeadline" DATETIME,
    "responseAction" TEXT,
    "adrAssessmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_adrAssessmentId_fkey" FOREIGN KEY ("adrAssessmentId") REFERENCES "ADRAssessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("amountInDispute", "applicantId", "caseNumber", "createdAt", "description", "disputeType", "id", "patentNumber", "patentTitle", "respondentId", "responseDeadline", "status", "updatedAt") SELECT "amountInDispute", "applicantId", "caseNumber", "createdAt", "description", "disputeType", "id", "patentNumber", "patentTitle", "respondentId", "responseDeadline", "status", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE TABLE "new_Expert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "technicalFields" TEXT NOT NULL,
    "qualifications" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "hourlyRate" REAL,
    "bio" TEXT,
    "panelCategory" TEXT,
    "averageRating" REAL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "applicationStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expert" ("availability", "bio", "createdAt", "hourlyRate", "id", "name", "qualifications", "technicalFields", "updatedAt", "userId") SELECT "availability", "bio", "createdAt", "hourlyRate", "id", "name", "qualifications", "technicalFields", "updatedAt", "userId" FROM "Expert";
DROP TABLE "Expert";
ALTER TABLE "new_Expert" RENAME TO "Expert";
CREATE UNIQUE INDEX "Expert_userId_key" ON "Expert"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CaseResponse_caseId_key" ON "CaseResponse"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertApplication_userId_key" ON "ExpertApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertRating_expertId_caseId_raterId_key" ON "ExpertRating"("expertId", "caseId", "raterId");

-- CreateIndex
CREATE UNIQUE INDEX "ConflictOfInterest_expertId_partyUserId_key" ON "ConflictOfInterest"("expertId", "partyUserId");
