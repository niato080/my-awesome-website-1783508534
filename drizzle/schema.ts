import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with e-commerce fields for marketplace functionality.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories for organizing templates
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }), // URL or emoji
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Animation templates for sale
 */
export const templates = mysqlTable(
  "templates",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    categoryId: int("categoryId").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    coverImage: varchar("coverImage", { length: 500 }), // S3 URL
    galleryImages: json("galleryImages").$type<string[]>().default([]), // Array of S3 URLs
    zipFileKey: varchar("zipFileKey", { length: 500 }), // S3 key for the ZIP file
    zipFileSize: int("zipFileSize"), // Size in bytes
    livePreviewUrl: varchar("livePreviewUrl", { length: 500 }), // URL to live demo
    features: json("features").$type<string[]>().default([]), // Array of feature strings
    technologies: json("technologies").$type<string[]>().default([]), // React, Vue, etc.
    tags: json("tags").$type<string[]>().default([]), // Search tags
    mobileCompatible: boolean("mobileCompatible").default(true),
    desktopCompatible: boolean("desktopCompatible").default(true),
    isFeatured: boolean("isFeatured").default(false),
    averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
    reviewCount: int("reviewCount").default(0),
    downloadCount: int("downloadCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("categoryIdx").on(table.categoryId),
    slugIdx: index("slugIdx").on(table.slug),
    featuredIdx: index("featuredIdx").on(table.isFeatured),
  })
);

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Orders placed by users
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
    status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0"),
    couponCode: varchar("couponCode", { length: 50 }),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    customerEmail: varchar("customerEmail", { length: 320 }),
    customerName: varchar("customerName", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("userIdx").on(table.userId),
    statusIdx: index("statusIdx").on(table.status),
    stripeIdx: index("stripeIdx").on(table.stripePaymentIntentId),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Individual items in an order
 */
export const orderItems = mysqlTable(
  "orderItems",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    templateId: int("templateId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("orderIdx").on(table.orderId),
    templateIdx: index("templateIdx").on(table.templateId),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Shopping cart for users
 */
export const cartItems = mysqlTable(
  "cartItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    templateId: int("templateId").notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => ({
    userTemplateIdx: index("userTemplateIdx").on(table.userId, table.templateId),
  })
);

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * User wishlist
 */
export const wishlistItems = mysqlTable(
  "wishlistItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    templateId: int("templateId").notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => ({
    userTemplateIdx: index("userTemplateIdx").on(table.userId, table.templateId),
  })
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;

/**
 * Reviews and ratings for templates
 */
export const reviews = mysqlTable(
  "reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    templateId: int("templateId").notNull(),
    userId: int("userId").notNull(),
    orderId: int("orderId"), // Reference to the order where user purchased
    rating: int("rating").notNull(), // 1-5 stars
    title: varchar("title", { length: 255 }),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    templateIdx: index("templateIdx").on(table.templateId),
    userIdx: index("userIdx").on(table.userId),
  })
);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Coupon codes for discounts
 */
export const coupons = mysqlTable(
  "coupons",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
    discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
    maxUses: int("maxUses"), // null = unlimited
    currentUses: int("currentUses").default(0),
    minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }), // Minimum order to apply
    expiresAt: timestamp("expiresAt"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    codeIdx: index("codeIdx").on(table.code),
    activeIdx: index("activeIdx").on(table.isActive),
  })
);

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Newsletter subscriptions
 */
export const newsletterSubscribers = mysqlTable(
  "newsletterSubscribers",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    isActive: boolean("isActive").default(true),
    subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribedAt"),
  },
  (table) => ({
    emailIdx: index("emailIdx").on(table.email),
    activeIdx: index("activeIdx").on(table.isActive),
  })
);

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * Recently viewed templates by user (for personalization)
 */
export const recentlyViewed = mysqlTable(
  "recentlyViewed",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    templateId: int("templateId").notNull(),
    viewedAt: timestamp("viewedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userTemplateIdx: index("userTemplateIdx").on(table.userId, table.templateId),
  })
);

export type RecentlyViewed = typeof recentlyViewed.$inferSelect;
export type InsertRecentlyViewed = typeof recentlyViewed.$inferInsert;
