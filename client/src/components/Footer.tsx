import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Facebook, Twitter, Linkedin, Github } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribeNewsletter = trpc.newsletter.subscribe.useMutation();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await subscribeNewsletter.mutateAsync({ email });
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    } catch (error) {
      console.error("Subscription failed", error);
    }
  };

  return (
    <footer className="border-t border-border/30 bg-card/30 backdrop-blur-xl">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold">✨</span>
              </div>
              <span className="font-bold text-lg">Animation Templates</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium HTML animation templates for every celebration. Create stunning interactive experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/templates" className="hover:text-accent transition-colors">
                  Browse Templates
                </a>
              </li>
              <li>
                <a href="/templates" className="hover:text-accent transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to get new templates and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subscribeNewsletter.isPending}
                  className="flex-1 bg-input border-border/50 text-sm"
                />
                <Button
                  type="submit"
                  disabled={subscribeNewsletter.isPending || !email.trim()}
                  className="btn-primary"
                  size="icon"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              {subscribed && (
                <p className="text-xs text-accent">✓ Thanks for subscribing!</p>
              )}
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Animation Templates. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-accent/10 transition-colors"
                title="Twitter"
              >
                <Twitter className="w-4 h-4 text-accent" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-accent/10 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4 text-accent" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-accent/10 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-accent" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-accent/10 transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4 text-accent" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
