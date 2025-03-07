-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerk_reference_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "userPreferencePrompt" TEXT
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerk_reference_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    CONSTRAINT "Conversation_clerk_reference_id_fkey" FOREIGN KEY ("clerk_reference_id") REFERENCES "User" ("clerk_reference_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerk_reference_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    CONSTRAINT "SearchHistory_clerk_reference_id_fkey" FOREIGN KEY ("clerk_reference_id") REFERENCES "User" ("clerk_reference_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerk_reference_id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folder_name" TEXT NOT NULL,
    CONSTRAINT "Folder_clerk_reference_id_fkey" FOREIGN KEY ("clerk_reference_id") REFERENCES "User" ("clerk_reference_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'url',
    "json_content" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    CONSTRAINT "File_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerk_reference_id_key" ON "User"("clerk_reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
