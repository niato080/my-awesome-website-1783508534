import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for authenticated user
function createMockContext(isAdmin = false): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: isAdmin ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Marketplace Features", () => {
  describe("Templates", () => {
    it("should search templates with pagination", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.search({
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveProperty("templates");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.templates)).toBe(true);
    });

    it("should get featured templates", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.getFeatured({ limit: 6 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Cart Operations", () => {
    it("should add item to cart", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.cart.addItem({
        templateId: 1,
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("templateId");
    });

    it("should get cart items for user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.cart.getItems();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Orders", () => {
    it("should get user's orders", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.orders.getMyOrders();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should create order from cart", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.orders.createFromCart({
        stripePaymentIntentId: "pi_test_123",
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("status");
    });
  });

  describe("Wishlist", () => {
    it("should add template to wishlist", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.addItem({
        templateId: 1,
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("templateId");
    });

    it("should get wishlist items", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wishlist.getItems();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Reviews", () => {
    it("should create review for purchased template", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reviews.create({
        templateId: 1,
        rating: 5,
        title: "Amazing template!",
        comment: "Great quality and easy to use",
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("templateId");
      expect(result.rating).toBe(5);
    });

    it("should get reviews for template", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.reviews.getByTemplate({ templateId: 1 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Coupons", () => {
    it("should validate coupon code", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.coupons.validate({
        code: "SAVE10",
      });

      expect(result).toHaveProperty("valid");
      if (result.valid) {
        expect(result).toHaveProperty("discountPercentage");
      }
    });
  });

  describe("Newsletter", () => {
    it("should subscribe to newsletter", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.newsletter.subscribe({
        email: "subscriber@example.com",
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email");
    });
  });

  describe("Categories", () => {
    it("should get all categories", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.categories.getAll();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Admin Operations", () => {
    it("should prevent non-admin from accessing admin procedures", async () => {
      const ctx = createMockContext(false); // Non-admin user
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.templates.create({
          title: "Test",
          slug: "test",
          description: "Test",
          categoryId: 1,
          price: "29.99",
          coverImage: "image.jpg",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin to create template", async () => {
      const ctx = createMockContext(true); // Admin user
      const caller = appRouter.createCaller(ctx);

      const result = await caller.templates.create({
        title: "Admin Test Template",
        slug: "admin-test",
        description: "Test template created by admin",
        categoryId: 1,
        price: "49.99",
        coverImage: "admin-image.jpg",
      });

      expect(result).toHaveProperty("id");
      expect(result.title).toBe("Admin Test Template");
    });
  });
});
