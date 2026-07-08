import { eq, and, gte, lte, like, desc, asc, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  templates,
  categories,
  orders,
  orderItems,
  cartItems,
  wishlistItems,
  reviews,
  coupons,
  newsletterSubscribers,
  recentlyViewed,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ TEMPLATES ============

export async function getTemplateBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.slug, slug))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFeaturedTemplates(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(templates)
    .where(eq(templates.isFeatured, true))
    .limit(limit);
}

export async function searchTemplates(
  query: string,
  categoryId?: number,
  minPrice?: number,
  maxPrice?: number,
  tags?: string[],
  sortBy: "newest" | "popularity" | "price-low" | "price-high" = "newest",
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return { templates: [], total: 0 };

  let conditions = [];

  if (query) {
    conditions.push(
      sql`(${templates.title} LIKE ${`%${query}%`} OR ${templates.description} LIKE ${`%${query}%`})`
    );
  }

  if (categoryId) {
    conditions.push(eq(templates.categoryId, categoryId));
  }

  if (minPrice !== undefined) {
    conditions.push(gte(templates.price, minPrice.toString()));
  }

  if (maxPrice !== undefined) {
    conditions.push(lte(templates.price, maxPrice.toString()));
  }

  let orderBy;
  switch (sortBy) {
    case "popularity":
      orderBy = desc(templates.downloadCount);
      break;
    case "price-low":
      orderBy = asc(templates.price);
      break;
    case "price-high":
      orderBy = desc(templates.price);
      break;
    case "newest":
    default:
      orderBy = desc(templates.createdAt);
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(templates)
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(templates)
    .where(whereCondition);

  return {
    templates: result,
    total: countResult[0]?.count || 0,
  };
}

export async function getRelatedTemplates(templateId: number, limit: number = 4) {
  const db = await getDb();
  if (!db) return [];

  const template = await getTemplateById(templateId);
  if (!template) return [];

  return await db
    .select()
    .from(templates)
    .where(
      and(
        eq(templates.categoryId, template.categoryId),
        sql`${templates.id} != ${templateId}`
      )
    )
    .limit(limit);
}

// ============ CATEGORIES ============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.order), asc(categories.name));
}

// ============ CART ============

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));

  // Fetch template details for each cart item
  const templateIds = items.map((item) => item.templateId);
  if (templateIds.length === 0) return [];

  const templateDetails = await db
    .select()
    .from(templates)
    .where(inArray(templates.id, templateIds));

  return items.map((item) => ({
    ...item,
    template: templateDetails.find((t) => t.id === item.templateId),
  }));
}

export async function addToCart(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) return null;

  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.templateId, templateId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(cartItems).values({ userId, templateId });
  return { userId, templateId, id: result[0]?.insertId, addedAt: new Date() };
}

export async function removeFromCart(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) return false;
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.templateId, templateId)));
  return true;
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  return true;
}

// ============ WISHLIST ============

export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));

  const templateIds = items.map((item) => item.templateId);
  if (templateIds.length === 0) return [];

  const templateDetails = await db
    .select()
    .from(templates)
    .where(inArray(templates.id, templateIds));

  return items.map((item) => ({
    ...item,
    template: templateDetails.find((t) => t.id === item.templateId),
  }));
}

export async function addToWishlist(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.templateId, templateId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(wishlistItems).values({ userId, templateId });
  return { userId, templateId, id: result[0]?.insertId, addedAt: new Date() };
}

export async function removeFromWishlist(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) return false;
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.templateId, templateId)));
  return true;
}

// ============ ORDERS ============

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  // Fetch order items for each order
  const orderIds = userOrders.map((o) => o.id);
  if (orderIds.length === 0) return [];

  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  return userOrders.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));
}

export async function createOrder(
  userId: number,
  subtotal: string,
  total: string,
  couponCode?: string,
  discountAmount?: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(orders).values({
    userId,
    subtotal,
    total,
    discountAmount: discountAmount || "0",
    couponCode,
    status: "pending",
  });

  return result[0]?.insertId;
}

export async function addOrderItem(
  orderId: number,
  templateId: number,
  title: string,
  price: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(orderItems).values({
    orderId,
    templateId,
    title,
    price,
  });

  return result[0]?.insertId;
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "completed" | "failed" | "refunded",
  stripePaymentIntentId?: string
) {
  const db = await getDb();
  if (!db) return false;

  const updateData: Record<string, unknown> = { status };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  return true;
}

// ============ REVIEWS ============

export async function getTemplateReviews(templateId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(reviews)
    .where(eq(reviews.templateId, templateId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(
  templateId: number,
  userId: number,
  rating: number,
  title?: string,
  comment?: string,
  orderId?: number
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(reviews).values({
    templateId,
    userId,
    rating,
    title,
    comment,
    orderId,
  });

  return result[0]?.insertId;
}

export async function updateAverageRating(templateId: number) {
  const db = await getDb();
  if (!db) return;

  const reviewStats = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(eq(reviews.templateId, templateId));

  const stats = reviewStats[0];
  if (stats) {
    await db
      .update(templates)
      .set({
        averageRating: stats.avgRating?.toString() || "0",
        reviewCount: stats.count,
      })
      .where(eq(templates.id, templateId));
  }
}

// ============ COUPONS ============

export async function validateCoupon(code: string, orderTotal: string) {
  const db = await getDb();
  if (!db) return null;

  const coupon = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
    .limit(1);

  if (coupon.length === 0) return null;

  const c = coupon[0];

  // Check expiration
  if (c.expiresAt && c.expiresAt < new Date()) {
    return null;
  }

  // Check max uses
  if (c.maxUses && c.currentUses !== null && c.currentUses >= c.maxUses) {
    return null;
  }

  // Check minimum order amount
  if (c.minOrderAmount && parseFloat(orderTotal) < parseFloat(c.minOrderAmount.toString())) {
    return null;
  }

  return c;
}

export async function incrementCouponUse(couponId: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(coupons)
    .set({ currentUses: sql`${coupons.currentUses} + 1` })
    .where(eq(coupons.id, couponId));

  return true;
}

// ============ NEWSLETTER ============

export async function subscribeToNewsletter(email: string) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    // Reactivate if previously unsubscribed
    await db
      .update(newsletterSubscribers)
      .set({ isActive: true, unsubscribedAt: null })
      .where(eq(newsletterSubscribers.email, email));
    return existing[0];
  }

  const result = await db.insert(newsletterSubscribers).values({ email });
  return result[0]?.insertId;
}

export async function unsubscribeFromNewsletter(email: string) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(newsletterSubscribers)
    .set({ isActive: false, unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));

  return true;
}

// ============ RECENTLY VIEWED ============

export async function trackRecentlyViewed(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(recentlyViewed)
    .where(and(eq(recentlyViewed.userId, userId), eq(recentlyViewed.templateId, templateId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(recentlyViewed)
      .set({ viewedAt: new Date() })
      .where(and(eq(recentlyViewed.userId, userId), eq(recentlyViewed.templateId, templateId)));
  } else {
    await db.insert(recentlyViewed).values({ userId, templateId });
  }
}

export async function getRecentlyViewed(userId: number, limit: number = 6) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select()
    .from(recentlyViewed)
    .where(eq(recentlyViewed.userId, userId))
    .orderBy(desc(recentlyViewed.viewedAt))
    .limit(limit);

  const templateIds = items.map((item) => item.templateId);
  if (templateIds.length === 0) return [];

  const templateDetails = await db
    .select()
    .from(templates)
    .where(inArray(templates.id, templateIds));

  return items.map((item) => ({
    ...item,
    template: templateDetails.find((t) => t.id === item.templateId),
  }));
}
