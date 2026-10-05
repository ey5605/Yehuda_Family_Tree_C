import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const treeState=sqliteTable('tree_state',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),ownerEmail:text('owner_email').notNull(),revision:integer('revision').notNull().default(0),objectKey:text('object_key'),updatedAt:text('updated_at').notNull()});
export const memberships=sqliteTable('memberships',{email:text('email').primaryKey(),role:text('role').notNull(),createdAt:text('created_at').notNull()});
export const photos=sqliteTable('photos',{id:text('id').primaryKey(),objectKey:text('object_key').notNull(),mimeType:text('mime_type').notNull(),fileName:text('file_name').notNull(),createdAt:text('created_at').notNull()});

export const loginAttempts=sqliteTable('login_attempts',{id:text('id').primaryKey(),attempts:integer('attempts').notNull(),expiresAt:integer('expires_at').notNull()});
