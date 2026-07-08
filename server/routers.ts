import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  templates: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => await db.getTemplateBySlug(input.slug)),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => await db.getTemplateById(input.id)),

    getFeatured: publicProcedure
      .input(z.object({ limit: z.number().default(6) }))
      .query(async ({ input }) => await db.getFeaturedTemplates(input.limit)),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().default(""),
          categoryId: z.number().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          sortBy: z.enum(["newest", "popularity", "price-low", "price-high"]).default("newest"),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) =>
        db.searchTemplates(
          input.query,
          input.categoryId,
          input.minPrice,
          input.maxPrice,
          undefined,
          input.sortBy,
          input.limit,
          input.offset
        )
      ),

    getRelated: publicProcedure
      .input(z.object({ templateId: z.number(), limit: z.number().default(4) }))
      .query(async ({ input }) => db.getRelatedTemplates(input.templateId, input.limit)),

    trackView: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.trackRecentlyViewed(ctx.user.id, input.templateId);
        return { success: true };
      }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => db.getAllCategories()),
  }),

  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => db.getCartItems(ctx.user.id)),

    addItem: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => db.addToCart(ctx.user.id, input.templateId)),

    removeItem: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFromCart(ctx.user.id, input.templateId);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  wishlist: router({
    getItems: protectedProcedure.query(async ({ ctx }) => db.getWishlistItems(ctx.user.id)),

    addItem: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => db.addToWishlist(ctx.user.id, input.templateId)),

    removeItem: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFromWishlist(ctx.user.id, input.templateId);
        return { success: true };
      }),
  }),

  orders: router({
    getMyOrders: protectedProcedure.query(async ({ ctx }) => db.getUserOrders(ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              templateId: z.number(),
              title: z.string(),
              price: z.string(),
            })
          ),
          couponCode: z.string().optional(),
          discountAmount: z.string().optional(),
          subtotal: z.string(),
          total: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const orderId = await db.createOrder(
          ctx.user.id,
          input.subtotal,
          input.total,
          input.couponCode,
          input.discountAmount
        );

        if (!orderId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create order" });
        }

        for (const item of input.items) {
          await db.addOrderItem(orderId, item.templateId, item.title, item.price);
        }

        if (input.couponCode) {
          const coupon = await db.validateCoupon(input.couponCode, input.subtotal);
          if (coupon) {
            await db.incrementCouponUse(coupon.id);
          }
        }

        return { orderId };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "completed", "failed", "refunded"]),
          stripePaymentIntentId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const orders = await db.getUserOrders(ctx.user.id);
        if (!orders.find((o) => o.id === input.orderId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Order not found" });
        }

        await db.updateOrderStatus(input.orderId, input.status, input.stripePaymentIntentId);
        return { success: true };
      }),
  }),

  reviews: router({
    getForTemplate: publicProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => db.getTemplateReviews(input.templateId)),

    create: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          rating: z.number().min(1).max(5),
          title: z.string().optional(),
          comment: z.string().optional(),
          orderId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const reviewId = await db.createReview(
          input.templateId,
          ctx.user.id,
          input.rating,
          input.title,
          input.comment,
          input.orderId
        );

        if (reviewId) {
          await db.updateAverageRating(input.templateId);
        }

        return { reviewId, success: !!reviewId };
      }),
  }),

  coupons: router({
    validate: publicProcedure
      .input(z.object({ code: z.string(), orderTotal: z.string() }))
      .query(async ({ input }) => {
        const coupon = await db.validateCoupon(input.code, input.orderTotal);
        if (!coupon) {
          return { valid: false, coupon: null };
        }

        return {
          valid: true,
          coupon: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          },
        };
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await db.subscribeToNewsletter(input.email);
        return { success: !!result };
      }),

    unsubscribe: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await db.unsubscribeFromNewsletter(input.email);
        return { success: result };
      }),
  }),

  user: router({
    getRecentlyViewed: protectedProcedure
      .input(z.object({ limit: z.number().default(6) }))
      .query(async ({ input, ctx }) => db.getRecentlyViewed(ctx.user.id, input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
